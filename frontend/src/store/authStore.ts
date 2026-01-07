import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, AuthState } from '../types'
import { authAPI, teacherAPI, guardianAPI, schoolAPI } from '../services/api'


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
  activeModules: string[]
  modulePermissions: Record<string, any>
  setActiveModules: (modules: string[]) => void
  setModulePermissions: (permissions: Record<string, any>) => void
  fetchActiveModules: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string, tenantCode?: string) => Promise<void>
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
        activeModules: [],
        modulePermissions: {},
        isLoading: false,
        error: null,

        setActiveModules: (modules) => set({ activeModules: modules }),
        setModulePermissions: (permissions) => set({ modulePermissions: permissions }),

        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),
        setRefreshToken: (token) => set({ refreshToken: token }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // ... login/register/logout methods unchanged ...

        login: async (email, password, tenantCode) => {
          set({ isLoading: true, error: null })
          try {
            // Pass tenantCode in header via API configuration or argument?
            // Since authAPI.login takes an object, we need to see its definition.
            // Assuming we need to pass headers. But authAPI.login likely takes {email, password}.
            // We'll update api.ts if needed, but for now let's assume we can pass it as config to axios 
            // OR the valid way for this project: set header on global instance?
            // Actually, `authAPI` is likely an object wrapper. 
            // We should check `api.ts` first. For now, assuming authAPI.login accepts headers as second arg or similar requires checking.
            // But to fix the TYPE ERROR in login.tsx, we definitely need to update this signature.

            // Wait, I need to check api.ts to know how to pass the header.
            // For now, I will update the signature.
            const response = await authAPI.login({ email, password }, tenantCode)
            const { data, tokens } = response.data

            const transformedUser = transformUserData(data)

            set({
              user: transformedUser,
              token: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isLoading: false,
            })

            // Store tokens in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', tokens.accessToken)
              // Refresh token is stored in HttpOnly cookie
            }

            // Fetch modules immediately after login using the transformed user data
            if (transformedUser?.schoolId) {
              console.log('[login] Calling fetchActiveModules for schoolId:', transformedUser.schoolId)
              get().fetchActiveModules()
            } else {
              console.warn('[login] No schoolId found in user data:', transformedUser)
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

          // Attempt to notify backend BEFORE clearing local state
          // to ensure X-Tenant-Code and Authorization headers are present.
          try {
            await authAPI.logout()
          } catch (error) {
            console.error('Logout error:', error)
          }

          // Clear local state
          set({
            user: null,
            token: null,
            refreshToken: null,
            activeModules: [],
            modulePermissions: {},
            isLoading: false,
          })

          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token')
            localStorage.removeItem('loginUser')
            localStorage.removeItem('selected_school')
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

            // Fetch active modules if user has school
            if (data.school_id) {
              get().fetchActiveModules()
            }

          } catch (error) {
            localStorage.removeItem('access_token')
            // Refresh token cookie is cleared by backend
            set({ user: null, token: null, isLoading: false })
          }
        },

        fetchActiveModules: async () => {
          const { user } = get()
          if (!user?.schoolId) {
            console.log('[fetchActiveModules] No schoolId found for user:', user)
            return
          }

          try {
            console.log('[fetchActiveModules] Fetching for schoolId:', user.schoolId)
            const response = await schoolAPI.get(user.schoolId.toString())
            console.log('[fetchActiveModules] Raw response:', response)
            console.log('[fetchActiveModules] response.data:', response.data)

            // Handle both { data: { ... } } and { ... } formats just in case
            const schoolData = response.data.data || response.data
            console.log('[fetchActiveModules] Parsed schoolData:', schoolData)
            console.log('[fetchActiveModules] active_modules:', schoolData.active_modules)
            console.log('[fetchActiveModules] module_permissions:', schoolData.module_permissions)

            set({
              activeModules: schoolData.active_modules || [],
              modulePermissions: schoolData.module_permissions || {}
            })

            console.log('[fetchActiveModules] Store updated successfully')
          } catch (error) {
            console.error("[fetchActiveModules] Failed to fetch active modules", error)
          }
        }
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          activeModules: state.activeModules,
          modulePermissions: state.modulePermissions,
          // refreshToken: state.refreshToken, // Don't persist refresh token
        }),
      }
    )
  )
)
