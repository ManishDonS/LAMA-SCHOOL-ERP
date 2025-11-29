import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { schoolAPI } from '../../services/api'
import { useAuthStore } from '@/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

interface School {
  id: string
  name: string
  code: string
  db_name: string
  domain: string
  logo_url: string
  timezone: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

interface FormData {
  name: string
  code: string
  domain: string
  logo_url: string
  timezone: string
  db_user: string
  db_password: string
}

// @ts-ignore
const TIMEZONES = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC', 'Asia/Kolkata', 'America/New_York'];

const DEFAULT_FORM_STATE: FormData = {
  name: '',
  code: '',
  domain: '',
  logo_url: '',
  timezone: 'Asia/Kolkata',
  db_user: '',
  db_password: '',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
}

function SchoolsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)
  const [pagination, setPagination] = useState({ limit: 10, offset: 0 })
  const [stats, setStats] = useState<Record<string, any>>({})
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions'>('basic')
  const [permissions, setPermissions] = useState({
    students: { create: true, read: true, update: true, delete: false },
    teachers: { create: true, read: true, update: true, delete: false },
    classes: { create: true, read: true, update: true, delete: false },
    attendance: { create: true, read: true, update: false, delete: false },
    grades: { create: true, read: true, update: true, delete: false },
    finance: { create: false, read: true, update: false, delete: false },
    reports: { create: false, read: true, update: false, delete: false },
    settings: { create: false, read: false, update: false, delete: false },
  })

  useEffect(() => {
    fetchSchools()
  }, [pagination])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const target = event.target as HTMLElement
        if (!target.closest('.menu-container')) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const fetchSchools = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await schoolAPI.list({
        limit: pagination.limit,
        offset: pagination.offset,
      })
      // Handle both response.data.data and response.data formats
      const schoolsData = response.data.data || response.data || []
      const schoolsList = Array.isArray(schoolsData) ? schoolsData : []
      setSchools(schoolsList)

      // Fetch stats for each school
      const statsMap: Record<string, any> = {}
      for (const school of schoolsList) {
        try {
          const statsRes = await schoolAPI.stats(school.code)
          statsMap[school.code] = statsRes.data.stats
        } catch (err) {
          console.error(`Failed to fetch stats for ${school.code}:`, err)
        }
      }
      setStats(statsMap)
    } catch (err: any) {
      // Don't show error for empty list (when data is null)
      if (err.response?.data?.data === null) {
        setSchools([])
      } else {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch schools'
        console.error('Fetch schools error:', err)
        setError(errorMessage)
        setSchools([]) // Clear schools on error
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('School name is required')
      return false
    }
    if (!formData.code.trim()) {
      setError('School code is required')
      return false
    }
    if (!formData.domain.trim()) {
      setError('Domain is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // Update school
        const updateData = {
          name: formData.name,
          domain: formData.domain,
          logo_url: formData.logo_url,
          timezone: formData.timezone,
        }
        await schoolAPI.update(editingId, updateData)
        setSuccess('School updated successfully')
        setEditingId(null)
      } else {
        // Create new school
        await schoolAPI.create(formData)
        setSuccess('School created successfully')
      }
      setFormData(DEFAULT_FORM_STATE)
      setShowForm(false)
      fetchSchools()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save school')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (school: School) => {
    setEditingId(school.id)
    setFormData({
      name: school.name,
      code: school.code,
      domain: school.domain,
      logo_url: school.logo_url,
      timezone: school.timezone,
      db_user: '',
      db_password: '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      await schoolAPI.delete(id)
      setSuccess('School deleted successfully')
      fetchSchools()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete school')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setError(null)
    setActiveTab('basic')
  }

  const handleNewSchool = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setError(null)
    setShowForm(true)
  }

  const toggleMenu = (schoolId: string) => {
    setOpenMenuId(openMenuId === schoolId ? null : schoolId)
  }

  const handleLoginToSchool = (school: School) => {
    // Store the selected school
    localStorage.setItem('selected_school', JSON.stringify(school))
    setSuccess(`Switched to ${school.name}. Redirecting to dashboard...`)
    setTimeout(() => {
      // Reload to update navbar
      window.location.href = '/dashboard'
    }, 1000)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploadingLogo(true)
    setError(null)

    try {
      const response = await schoolAPI.uploadLogo(file)
      setFormData((prev) => ({ ...prev, logo_url: response.data.url }))
      setSuccess('Logo uploaded successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handlePermissionChange = (module: string, action: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module as keyof typeof prev],
        [action]: value
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Schools Management
            </h1>
            <p className="text-gray-600">Manage multiple schools and their databases</p>
          </div>

          {/* Action Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleNewSchool}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              + Add New School
            </button>
          </div>
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit School' : 'Create New School'}
                  </h2>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex px-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab('basic')}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'basic'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      Basic Information
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('permissions')}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'permissions'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      Permissions
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Basic Information Tab */}
                  {activeTab === 'basic' && (
                    <>
                      {/* School Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          School Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., Example International School"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* School Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          School Code * {editingId && <span className="text-gray-500">(Cannot be changed)</span>}
                        </label>
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          placeholder="e.g., eis (lowercase, no spaces)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={!!editingId}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Unique identifier for the school (e.g., eis, kmc, ams)</p>
                      </div>

                      {/* Domain */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Domain *
                        </label>
                        <input
                          type="text"
                          name="domain"
                          value={formData.domain}
                          onChange={handleInputChange}
                          placeholder="e.g., eis.school-erp.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Logo URL */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          School Logo
                        </label>

                        {/* Logo Preview */}
                        {formData.logo_url && (
                          <div className="mb-3">
                            <img
                              src={formData.logo_url}
                              alt="School logo preview"
                              className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                            />
                          </div>
                        )}

                        {/* File Upload Button */}
                        <div className="flex gap-3">
                          <label
                            htmlFor="logo-upload"
                            className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-center ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                          >
                            {uploadingLogo ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Logo
                              </span>
                            )}
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={uploadingLogo}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Upload an image file (max 5MB)</p>
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          name="timezone"
                          value={formData.timezone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {TIMEZONES.map((tz: string) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Database Configuration Section - Only for new schools */}
                      {!editingId && (
                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                            Database Configuration
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            A separate database will be created for this school. You can customize credentials or leave blank for auto-generation.
                          </p>

                          {/* Database Name Preview */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Database Name (Auto-generated)
                            </label>
                            <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-mono text-sm">
                              {formData.code ? `school_${formData.code}_db` : 'school_[code]_db'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">This will be the name of the PostgreSQL database</p>
                          </div>

                          {/* Database User */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Database User (Optional)
                            </label>
                            <input
                              type="text"
                              name="db_user"
                              value={formData.db_user}
                              onChange={handleInputChange}
                              placeholder={formData.code ? `school_${formData.code}_user (auto-generated)` : 'Leave blank for auto-generation'}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave blank to auto-generate as: school_{formData.code || 'code'}_user
                            </p>
                          </div>

                          {/* Database Password */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Database Password (Optional)
                            </label>
                            <input
                              type="password"
                              name="db_password"
                              value={formData.db_password}
                              onChange={handleInputChange}
                              placeholder="Leave blank to auto-generate secure password"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave blank to auto-generate a secure random password (recommended)
                            </p>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-2">
                              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Database Isolation</p>
                                <p>Each school gets a completely separate database with its own user and credentials. All data is isolated and secure.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Permissions Tab */}
                  {activeTab === 'permissions' && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                          Configure which modules and actions are available for this school. These permissions apply to all users within this school.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(permissions).map(([module, actions]) => (
                          <div key={module} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3 capitalize flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              {module}
                            </h4>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.entries(actions).map(([action, value]) => (
                                <label key={action} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={value as boolean}
                                    onChange={(e) => handlePermissionChange(module, action, e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700 capitalize">{action}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex gap-2">
                          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Note</p>
                            <p>These are default permissions for the school. Individual user roles and permissions can be further customized in the user management section.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
                    >
                      {loading ? 'Processing...' : editingId ? 'Update School' : 'Create School'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Schools Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden max-w-full">
            {loading && schools.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading schools...</p>
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No schools yet</h3>
                <p className="mt-1 text-gray-600">Get started by creating your first school</p>
                <button
                  onClick={handleNewSchool}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  Create First School
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        School Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Database
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Timezone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Connections
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schools.map((school) => (
                      <tr key={school.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {school.logo_url ? (
                              <img
                                src={school.logo_url}
                                alt={school.name}
                                className="h-8 w-8 rounded-full mr-3"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 mr-3"></div>
                            )}
                            <span className="text-sm font-medium text-gray-900">{school.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <code className="bg-gray-100 px-2 py-1 rounded">{school.code}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono">
                            {school.db_name}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {school.domain}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {school.timezone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[school.status] || 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stats[school.code]?.idle_conns !== undefined ? (
                            <span>
                              {stats[school.code]?.idle_conns}/{stats[school.code]?.max_conns}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative menu-container">
                          <button
                            onClick={() => toggleMenu(school.id)}
                            className="text-gray-600 hover:text-gray-900 transition p-2 rounded-lg hover:bg-gray-100"
                            aria-label="More options"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {openMenuId === school.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleLoginToSchool(school)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                  </svg>
                                  Login to School
                                </button>
                                <button
                                  onClick={() => {
                                    handleEdit(school)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    handleDelete(school.id, school.name)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {schools.length > 0 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {pagination.offset + 1} to {pagination.offset + schools.length} schools
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })
                    }
                    disabled={pagination.offset === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                    disabled={schools.length < pagination.limit}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Multi-Tenancy</h3>
              <p className="text-sm text-blue-700">
                Each school gets its own database. Data is completely isolated and secure.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Auto Setup</h3>
              <p className="text-sm text-green-700">
                Database and schema are automatically created and configured when you add a school.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ProtectedSchoolsPage() {
  return (
    <ProtectedRoute>
      <SchoolsPage />
    </ProtectedRoute>
  )
}
