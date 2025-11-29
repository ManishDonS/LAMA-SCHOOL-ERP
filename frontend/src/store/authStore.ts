import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, AuthState } from '../types'
import { authAPI, teacherAPI, guardianAPI } from '../services/api'

// Helper function to transform API response from snake_case to camelCase
const transformUserData = (data: any): User => ({
  id: data.id,
  email: data.email,
  firstName: data.first_name || data.firstName,
  lastName: data.last_name || data.lastName,
  role: (data.role || 'student') as User['role'],
  schoolId: data.school_id || data.schoolId,
  status: (data.status || 'active') as User['status'],
  createdAt: data.created_at || data.createdAt,
})

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setRefreshToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,

        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),
        setRefreshToken: (token) => set({ refreshToken: token }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        login: async (email, password) => {
          set({ isLoading: true, error: null })
          try {
            const response = await authAPI.login({ email, password })
            const { data, tokens } = response.data

            set({
              user: transformUserData(data),
              token: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isLoading: false,
            })

            // Store tokens in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', tokens.accessToken)
              // Refresh token is stored in HttpOnly cookie
            }
          } catch (error: any) {
            const message = error.response?.data?.error || 'Login failed'
            set({ error: message, isLoading: false })
            throw error
          }
        },

        register: async (registrationData) => {
          set({ isLoading: true, error: null })
          try {
            // Step 1: Register user account with auth service
            const response = await authAPI.register(registrationData)
            const { data: user, tokens } = response.data

            set({
              user: transformUserData(user),
              token: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isLoading: false,
            })

            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', tokens.accessToken)
              // Refresh token is stored in HttpOnly cookie
            }

            // Profile creation is now handled by the backend via NATS events
            // based on the role provided during registration.
          } catch (error: any) {
            const message = error.response?.data?.error || 'Registration failed'
            set({ error: message, isLoading: false })
            throw error
          }
        },

        logout: async () => {
          set({ isLoading: true })

          // Always clear local state immediately
          set({
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,
          })

          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token')
            // Refresh token cookie is cleared by backend
            localStorage.removeItem('loginUser')
          }

          // Attempt to notify backend but don't block on failure
          try {
            await authAPI.logout()
          } catch (error) {
            console.error('Logout error:', error)
            // Continue even if API call fails
          }
        },

        restoreSession: async () => {
          if (typeof window === 'undefined') return

          const token = localStorage.getItem('access_token')
          if (!token) return

          set({ isLoading: true })
          try {
            const response = await authAPI.me()
            const data = response.data.data

            set({
              user: transformUserData(data),
              token,
              isLoading: false,
            })
          } catch (error) {
            localStorage.removeItem('access_token')
            // Refresh token cookie is cleared by backend
            set({ user: null, token: null, isLoading: false })
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          // refreshToken: state.refreshToken, // Don't persist refresh token
        }),
      }
    )
  )
)
