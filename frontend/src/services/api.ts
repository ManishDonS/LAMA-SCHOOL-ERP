import axios, { AxiosInstance, AxiosError } from 'axios'
import { AuthResponse, LoginRequest, RegisterRequest } from '../types'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
export const SCHOOL_API_URL = process.env.NEXT_PUBLIC_SCHOOL_API_URL || 'http://localhost:3011'

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
// Add request interceptor to include token and tenant code
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add Tenant Code header (only if not already set by the specific request)
    if (typeof window !== 'undefined' && !config.headers['X-Tenant-Code']) {
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        try {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          if (selectedSchool && selectedSchool.code) {
            config.headers['X-Tenant-Code'] = selectedSchool.code
          }
        } catch (e) {
          console.error('Failed to parse selected_school from localStorage', e)
        }
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Add request interceptor to school API client to include token
// Add request interceptor to school API client to include token and tenant code
schoolApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add Tenant Code header (some school API endpoints might need it for context)
    if (typeof window !== 'undefined') {
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        try {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          if (selectedSchool && selectedSchool.code) {
            config.headers['X-Tenant-Code'] = selectedSchool.code
          }
        } catch (e) {
          console.error('Failed to parse selected_school from localStorage', e)
        }
      }
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

// Shared response interceptor handles 401 negotiation
const createResponseInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
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
              // Use 'api' client to refresh, or fetch directly to avoid circular dependency loop if 'api' is the one failing?
              // 'api' instance is safe to use here as long as /refresh endpoint doesn't return 401 loop.
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
            return client(originalRequest)
          }
        } else {
          // Wait for the existing refresh promise
          return new Promise((resolve, reject) => {
            addRefreshSubscriber((token: string | null) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
                resolve(client(originalRequest))
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
}

// Set default timeout for main clients
api.defaults.timeout = 30000
schoolApiClient.defaults.timeout = 30000

export const authAPI = {
  login: (data: LoginRequest, tenantCode?: string) =>
    api.post<AuthResponse>('/api/v1/auth/login', data, {
      headers: tenantCode ? { 'X-Tenant-Code': tenantCode } : undefined
    }),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/api/v1/auth/register', data),
  me: () => api.get('/api/v1/auth/me'),
  logout: () => api.post('/api/v1/auth/logout'),
  refreshToken: () =>
    api.post('/api/v1/auth/refresh', {}),
  forgotPassword: (email: string) => api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/api/v1/auth/reset-password', { token, new_password: newPassword }),
}

// Separate API client for student service
export const STUDENT_API_URL = process.env.NEXT_PUBLIC_STUDENT_API_URL || 'http://localhost:3003'

const studentApiClient: AxiosInstance = axios.create({
  baseURL: STUDENT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to student API client to include token and tenant code
studentApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add Tenant Code header (some student API endpoints might need it for context)
    if (typeof window !== 'undefined') {
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        try {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          if (selectedSchool && selectedSchool.code) {
            config.headers['X-Tenant-Code'] = selectedSchool.code
          }
        } catch (e) {
          console.error('Failed to parse selected_school from localStorage', e)
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const studentAPI = {
  list: (params?: any) => studentApiClient.get('/api/v1/students', { params }),
  get: (id: number) => studentApiClient.get(`/api/v1/students/${id}`),
  create: (data: any) => studentApiClient.post('/api/v1/students', data),
  update: (id: number, data: any) => studentApiClient.put(`/api/v1/students/${id}`, data),
  delete: (id: number) => studentApiClient.delete(`/api/v1/students/${id}`),
}

// Separate API client for user service
export const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:3002'

const userApiClient: AxiosInstance = axios.create({
  baseURL: USER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to user API client to include token and tenant code
userApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add Tenant Code header 
    if (typeof window !== 'undefined') {
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        try {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          if (selectedSchool && selectedSchool.code) {
            config.headers['X-Tenant-Code'] = selectedSchool.code
          }
        } catch (e) {
          console.error('Failed to parse selected_school from localStorage', e)
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const teacherAPI = {
  list: (params?: any) => userApiClient.get('/api/v1/teachers', { params }),
  get: (id: string) => userApiClient.get(`/api/v1/teachers/${id}`),
  create: (data: any) => userApiClient.post('/api/v1/teachers', data),
  update: (id: string, data: any) => userApiClient.put(`/api/v1/teachers/${id}`, data),
  delete: (id: string) => userApiClient.delete(`/api/v1/teachers/${id}`),
}

export const guardianAPI = {
  list: (params?: any) => userApiClient.get('/api/v1/parents', { params }),
  get: (id: string) => userApiClient.get(`/api/v1/parents/${id}`),
  create: (data: any) => userApiClient.post('/api/v1/parents', data),
  update: (id: string, data: any) => userApiClient.put(`/api/v1/parents/${id}`, data),
  delete: (id: string) => userApiClient.delete(`/api/v1/parents/${id}`),
}

// Separate API client for attendance service
export const ATTENDANCE_API_URL = process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || 'http://localhost:3004'

const attendanceApiClient: AxiosInstance = axios.create({
  baseURL: ATTENDANCE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to attendance API client to include token and tenant code
attendanceApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add Tenant Code header 
    if (typeof window !== 'undefined') {
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        try {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          if (selectedSchool && selectedSchool.code) {
            config.headers['X-Tenant-Code'] = selectedSchool.code
          }
        } catch (e) {
          console.error('Failed to parse selected_school from localStorage', e)
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const attendanceAPI = {
  list: (params?: any) => attendanceApiClient.get('/api/v1/attendance', { params }),
  get: (id: string) => attendanceApiClient.get(`/api/v1/attendance/${id}`),
  create: (data: any) => attendanceApiClient.post('/api/v1/attendance', data),
  update: (id: string, data: any) => attendanceApiClient.put(`/api/v1/attendance/${id}`, data),
  delete: (id: string) => attendanceApiClient.delete(`/api/v1/attendance/${id}`),
}

// Separate API client for class service
export const CLASS_API_URL = process.env.NEXT_PUBLIC_CLASS_API_URL || 'http://localhost:3014'

const classApiClient: AxiosInstance = axios.create({
  baseURL: CLASS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to class API client to include token and tenant code
classApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add Tenant Code header 
    if (typeof window !== 'undefined') {
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        try {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          if (selectedSchool && selectedSchool.code) {
            config.headers['X-Tenant-Code'] = selectedSchool.code
          }
        } catch (e) {
          console.error('Failed to parse selected_school from localStorage', e)
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const classAPI = {
  list: (params?: any) => classApiClient.get('/api/v1/classes', { params }),
  get: (id: string) => classApiClient.get(`/api/v1/classes/${id}`),
  create: (data: any) => classApiClient.post('/api/v1/classes', data),
  update: (id: number, data: any) => classApiClient.put(`/api/v1/classes/${id}`, data),
  delete: (id: number) => classApiClient.delete(`/api/v1/classes/${id}`),
}


export const userAPI = {
  list: (params?: any) => userApiClient.get('/api/v1/users', { params }),
  get: (id: number) => userApiClient.get(`/api/v1/users/${id}`),
  create: (data: any) => userApiClient.post('/api/v1/users', data),
  update: (id: number, data: any) => userApiClient.put(`/api/v1/users/${id}`, data),
}

export const schoolAPI = {
  list: (params?: any) => schoolApiClient.get('/api/v1/schools', { params }),
  get: (id: string) => schoolApiClient.get(`/api/v1/schools/${id}`),
  create: (data: any) => schoolApiClient.post('/api/v1/schools', data),
  update: (id: string, data: any) => schoolApiClient.put(`/api/v1/schools/${id}`, data),
  delete: (id: string) => schoolApiClient.delete(`/api/v1/schools/${id}`),
  stats: (code: string) => schoolApiClient.get(`/api/v1/schools/${code}/stats`),
  uploadLogo: (schoolId: string, file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return schoolApiClient.post(`/api/v1/schools/${schoolId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  deleteLogo: (schoolId: string) => schoolApiClient.delete(`/api/v1/schools/${schoolId}/logo`),
  getModules: () => schoolApiClient.get('/api/v1/modules'),
  toggleModule: (schoolId: string, moduleId: string, active: boolean) =>
    schoolApiClient.post(`/api/v1/schools/${schoolId}/modules`, {
      module_id: moduleId,
      active,
    }),
  getAdmin: (id: string) => schoolApiClient.get(`/api/v1/schools/${id}/admin`),
  updateAdmin: (id: string, data: any) => schoolApiClient.put(`/api/v1/schools/${id}/admin`, data),

  // Roles & Permissions
  listRoles: (schoolId: string) => schoolApiClient.get(`/api/v1/schools/${schoolId}/roles`),
  createRole: (schoolId: string, data: any) => schoolApiClient.post(`/api/v1/schools/${schoolId}/roles`, data),
  getRole: (schoolId: string, roleId: string) => schoolApiClient.get(`/api/v1/schools/${schoolId}/roles/${roleId}`),
  updateRole: (schoolId: string, roleId: string, data: any) => schoolApiClient.put(`/api/v1/schools/${schoolId}/roles/${roleId}`, data),
  deleteRole: (schoolId: string, roleId: string) => schoolApiClient.delete(`/api/v1/schools/${schoolId}/roles/${roleId}`),
  listPermissions: (schoolId: string) => schoolApiClient.get(`/api/v1/schools/${schoolId}/permissions`),
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

// Apply refresh interceptors to other clients NOW that they are defined
// Apply interceptors to all clients
createResponseInterceptor(api)
createResponseInterceptor(schoolApiClient)
createResponseInterceptor(studentApiClient)
createResponseInterceptor(userApiClient)
createResponseInterceptor(transportApiClient)
createResponseInterceptor(classApiClient)

// Set timeout for other clients
studentApiClient.defaults.timeout = 30000
userApiClient.defaults.timeout = 30000
transportApiClient.defaults.timeout = 30000

export default api
