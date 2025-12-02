import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { schoolAPI } from '@/services/api'
import toast from 'react-hot-toast'

interface School {
  id: string
  name: string
  code: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '', schoolId: '' })
  const [schools, setSchools] = useState<School[]>([])
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const response = await schoolAPI.list({ limit: 100, offset: 0 })
      // Handle both response.data.data and response.data formats
      const schoolsData = response.data.data || response.data || []
      setSchools(Array.isArray(schoolsData) ? schoolsData : [])
    } catch (err) {
      console.error('Failed to fetch schools:', err)
      // Don't show error toast if it's just an empty list
      // toast.error('Failed to load schools')
      setSchools([])
    } finally {
      setLoadingSchools(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // Clear auth error when user starts typing
    if (error) {
      clearError()
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // School selection is optional (not required for super admin)

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Store selected school if one was selected
      if (formData.schoolId) {
        const selectedSchool = schools.find(s => s.id === formData.schoolId)
        if (selectedSchool) {
          localStorage.setItem('selected_school', JSON.stringify(selectedSchool))
        }
      }

      await login(formData.email, formData.password)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Login failed. Please try again.'
      toast.error(errorMsg)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">LAMA SCHOOL ERP</h1>
            <p className="text-gray-500 text-sm mt-2">Login to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* School Selection */}
            <div>
              <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">
                Select School
              </label>
              {loadingSchools ? (
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading schools...
                </div>
              ) : (
                <>
                  <select
                    id="schoolId"
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleChange}
                    aria-required="false"
                    aria-invalid={validationErrors.schoolId ? 'true' : 'false'}
                    aria-describedby={validationErrors.schoolId ? 'school-error' : undefined}
                    className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.schoolId
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                  >
                    <option value="">Choose your school...</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </option>
                    ))}
                  </select>
                  {validationErrors.schoolId && (
                    <p id="school-error" className="text-red-600 text-sm font-medium mt-1">
                      {validationErrors.schoolId}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={validationErrors.email ? 'true' : 'false'}
                  aria-describedby={validationErrors.email ? 'email-error' : undefined}
                  className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  placeholder="you@school.com"
                />
                {validationErrors.email && (
                  <span className="absolute right-3 top-3 text-red-500">⚠</span>
                )}
              </div>
              {validationErrors.email && (
                <p id="email-error" className="text-red-600 text-sm font-medium mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={validationErrors.password ? 'true' : 'false'}
                  aria-describedby={validationErrors.password ? 'password-error' : undefined}
                  className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  placeholder="••••••••"
                />
                {validationErrors.password && (
                  <span className="absolute right-3 top-3 text-red-500">⚠</span>
                )}
              </div>
              {validationErrors.password && (
                <p id="password-error" className="text-red-600 text-sm font-medium mt-1">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading && (
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              <span>{isLoading ? 'Logging in...' : 'Login'}</span>
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign up now
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-xs text-center">
              © 2024 LAMA SCHOOL ERP. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
