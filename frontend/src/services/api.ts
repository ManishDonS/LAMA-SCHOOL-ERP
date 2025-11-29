import axios, { AxiosInstance, AxiosError } from 'axios'
import { AuthResponse, LoginRequest, RegisterRequest } from '../types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const SCHOOL_API_URL = process.env.NEXT_PUBLIC_SCHOOL_API_URL || 'http://localhost:3011'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Separate API client for school service
const schoolApiClient: AxiosInstance = axios.create({
  baseURL: SCHOOL_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add request interceptor to school API client to include token
schoolApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Token refresh queue management
let isRefreshing = false
let refreshSubscribers: Array<(token: string | null) => void> = []
let refreshPromise: Promise<string | null> | null = null

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback)
}

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          message: 'Request timeout. Please check your connection.',
          code: 'TIMEOUT',
          originalError: error,
        })
      }

      if (error.message === 'Network Error') {
        return Promise.reject({
          message: 'Network error. Please check your internet connection.',
          code: 'NETWORK_ERROR',
          originalError: error,
        })
      }
    }

    const originalRequest = error.config as any

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      if (!isRefreshing) {
        isRefreshing = true

        // Create a single refresh promise that all requests can wait for
        refreshPromise = new Promise(async (resolve) => {
          try {
            // Refresh token is in HttpOnly cookie, sent automatically by browser
            const response = await api.post('/api/v1/auth/refresh', {})

            if (response.data.tokens) {
              const newAccessToken = response.data.tokens.accessToken
              // Only store access token, refresh token stays in HttpOnly cookie
              localStorage.setItem('access_token', newAccessToken)

              // Notify all waiting requests
              onRefreshed(newAccessToken)
              resolve(newAccessToken)
            } else {
              throw new Error('No tokens in refresh response')
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token')
              // No need to remove refresh_token as it's in HttpOnly cookie
              window.location.href = '/auth/login'
            }
            onRefreshed(null)
            resolve(null)
          } finally {
            isRefreshing = false
            refreshPromise = null
          }
        })

        // Wait for refresh to complete
        const newToken = await refreshPromise
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } else {
        // Wait for the existing refresh promise
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token: string | null) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            } else {
              reject(new Error('Token refresh failed'))
            }
          })
        })
      }
    }

    return Promise.reject(error)
  }
)

// Set default timeout
api.defaults.timeout = 30000 // 30 seconds

export const authAPI = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/api/v1/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/api/v1/auth/register', data),
  me: () => api.get('/api/v1/auth/me'),
  logout: () => api.post('/api/v1/auth/logout'),
  refreshToken: () =>
    api.post('/api/v1/auth/refresh', {}),
  forgotPassword: (email: string) => api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/api/v1/auth/reset-password', { token, new_password: newPassword }),
}

export const studentAPI = {
  list: (params?: any) => api.get('/api/v1/students', { params }),
  get: (id: number) => api.get(`/api/v1/students/${id}`),
  create: (data: any) => api.post('/api/v1/students', data),
  update: (id: number, data: any) => api.put(`/api/v1/students/${id}`, data),
  delete: (id: number) => api.delete(`/api/v1/students/${id}`),
}

export const teacherAPI = {
  list: (params?: any) => api.get('/api/v1/teachers', { params }),
  get: (id: string) => api.get(`/api/v1/teachers/${id}`),
  create: (data: any) => api.post('/api/v1/teachers', data),
  update: (id: string, data: any) => api.put(`/api/v1/teachers/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/teachers/${id}`),
}

export const guardianAPI = {
  list: (params?: any) => api.get('/api/v1/guardians', { params }),
  get: (id: string) => api.get(`/api/v1/guardians/${id}`),
  create: (data: any) => api.post('/api/v1/guardians', data),
  update: (id: string, data: any) => api.put(`/api/v1/guardians/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/guardians/${id}`),
}

export const attendanceAPI = {
  list: (params?: any) => api.get('/api/v1/attendance', { params }),
  get: (id: number) => api.get(`/api/v1/attendance/${id}`),
  create: (data: any) => api.post('/api/v1/attendance', data),
  update: (id: number, data: any) => api.put(`/api/v1/attendance/${id}`, data),
}

export const userAPI = {
  list: (params?: any) => api.get('/api/v1/users', { params }),
  get: (id: number) => api.get(`/api/v1/users/${id}`),
  create: (data: any) => api.post('/api/v1/users', data),
  update: (id: number, data: any) => api.put(`/api/v1/users/${id}`, data),
}

export const schoolAPI = {
  list: (params?: any) => schoolApiClient.get('/api/v1/schools', { params }),
  get: (id: string) => schoolApiClient.get(`/api/v1/schools/${id}`),
  create: (data: any) => schoolApiClient.post('/api/v1/schools', data),
  update: (id: string, data: any) => schoolApiClient.put(`/api/v1/schools/${id}`, data),
  delete: (id: string) => schoolApiClient.delete(`/api/v1/schools/${id}`),
  stats: (code: string) => schoolApiClient.get(`/api/v1/schools/${code}/stats`),
  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return schoolApiClient.post('/api/v1/schools/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Separate API client for transport service
const transportApiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TRANSPORT_API_URL || 'http://localhost:3009',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to transport API client to include token
transportApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const transportAPI = {
  // Bus
  listBuses: () => transportApiClient.get('/api/v1/transport/buses'),
  getBus: (id: string) => transportApiClient.get(`/api/v1/transport/buses/${id}`),
  createBus: (data: any) => transportApiClient.post('/api/v1/transport/buses', data),
  updateBus: (id: string, data: any) => transportApiClient.put(`/api/v1/transport/buses/${id}`, data),
  deleteBus: (id: string) => transportApiClient.delete(`/api/v1/transport/buses/${id}`),

  // Driver
  listDrivers: () => transportApiClient.get('/api/v1/transport/drivers'),
  getDriver: (id: string) => transportApiClient.get(`/api/v1/transport/drivers/${id}`),
  createDriver: (data: any) => transportApiClient.post('/api/v1/transport/drivers', data),
  updateDriver: (id: string, data: any) => transportApiClient.put(`/api/v1/transport/drivers/${id}`, data),
  deleteDriver: (id: string) => transportApiClient.delete(`/api/v1/transport/drivers/${id}`),

  // Route
  listRoutes: () => transportApiClient.get('/api/v1/transport/routes'),
  getRoute: (id: string) => transportApiClient.get(`/api/v1/transport/routes/${id}`),
  createRoute: (data: any) => transportApiClient.post('/api/v1/transport/routes', data),
  updateRoute: (id: string, data: any) => transportApiClient.put(`/api/v1/transport/routes/${id}`, data),
  deleteRoute: (id: string) => transportApiClient.delete(`/api/v1/transport/routes/${id}`),

  // Assignment
  listAssignments: () => transportApiClient.get('/api/v1/transport/assignments'),
  createAssignment: (data: any) => transportApiClient.post('/api/v1/transport/assignments', data),
  deleteAssignment: (id: string) => transportApiClient.delete(`/api/v1/transport/assignments/${id}`),

  // Traccar
  getTraccarToken: () => transportApiClient.get('/api/v1/transport/traccar/token'),
  proxyTraccar: (method: string, path: string, data?: any) =>
    transportApiClient.request({
      method,
      url: `/api/v1/transport/traccar${path}`,
      data,
    }),

  // Settings
  getSettings: () => transportApiClient.get('/api/v1/transport/settings'),
  updateSettings: (data: any) => transportApiClient.put('/api/v1/transport/settings', data),
}

export default api
