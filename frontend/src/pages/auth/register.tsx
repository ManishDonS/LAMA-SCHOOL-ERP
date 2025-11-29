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
  status: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolId: '',
    role: 'student',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [schools, setSchools] = useState<School[]>([])
  const [loadingSchools, setLoadingSchools] = useState(true)

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await schoolAPI.list({ limit: 100, offset: 0 })
        // Handle both response.data.data and response.data formats
        const schoolsData = response.data.data || response.data || []
        const activeSchools = (Array.isArray(schoolsData) ? schoolsData : []).filter(
          (school: School) => school.status === 'active'
        )
        setSchools(activeSchools)
        // Set first school as default if available
        if (activeSchools.length > 0 && !formData.schoolId) {
          setFormData(prev => ({ ...prev, schoolId: activeSchools[0].id }))
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error)
        // Don't show error toast if it's just an empty list
        setSchools([])
      } finally {
        setLoadingSchools(false)
      }
    }

    fetchSchools()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    if (error) {
      clearError()
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters'
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one number'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.schoolId) {
      errors.schoolId = 'Please select a school'
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
      // Transform form data to match backend API expectations (snake_case)
      const apiData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        school_id: parseInt(formData.schoolId, 10),
        role: formData.role,
      }
      await register(apiData)
      toast.success('Registration successful! Redirecting to login...')
      router.push('/auth/login')
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Registration failed. Please try again.'
      toast.error(errorMsg)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">School ERP</h1>
            <p className="text-gray-500 text-sm mt-2">Create your account</p>
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={validationErrors.firstName ? 'true' : 'false'}
                  className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.firstName
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  placeholder="John"
                />
                {validationErrors.firstName && (
                  <p className="text-red-600 text-sm font-medium mt-1">{validationErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={validationErrors.lastName ? 'true' : 'false'}
                  className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.lastName
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  placeholder="Doe"
                />
                {validationErrors.lastName && (
                  <p className="text-red-600 text-sm font-medium mt-1">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
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
                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.email
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="john.doe@school.com"
              />
              {validationErrors.email && (
                <p className="text-red-600 text-sm font-medium mt-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Role and School ID Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role Field */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {/* School Field */}
              <div>
                <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">
                  School
                </label>
                <select
                  id="schoolId"
                  name="schoolId"
                  required
                  value={formData.schoolId}
                  onChange={handleChange}
                  disabled={loadingSchools || schools.length === 0}
                  aria-required="true"
                  aria-invalid={validationErrors.schoolId ? 'true' : 'false'}
                  className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.schoolId
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${loadingSchools || schools.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {loadingSchools ? 'Loading schools...' : schools.length === 0 ? 'No schools available' : 'Select your school'}
                  </option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name || 'Unknown School'} ({school.code || 'N/A'})
                    </option>
                  ))}
                </select>
                {validationErrors.schoolId && (
                  <p className="text-red-600 text-sm font-medium mt-1">{validationErrors.schoolId}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={validationErrors.password ? 'true' : 'false'}
                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.password
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="••••••••"
              />
              {validationErrors.password && (
                <p className="text-red-600 text-sm font-medium mt-1">{validationErrors.password}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                Min 8 characters, 1 uppercase letter, 1 number
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={validationErrors.confirmPassword ? 'true' : 'false'}
                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="••••••••"
              />
              {validationErrors.confirmPassword && (
                <p className="text-red-600 text-sm font-medium mt-1">{validationErrors.confirmPassword}</p>
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
              <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-xs text-center">
              © 2024 School ERP. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
