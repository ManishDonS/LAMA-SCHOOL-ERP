import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import { schoolAPI } from '@/services/api'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { toast } from 'react-hot-toast'

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'Active' | 'Inactive'
  description: string
  is_current: boolean
}

interface GeneralSettings {
  schoolName: string
  schoolCode: string
  schoolType: string
  email: string
  phone: string
  alternatePhone: string
  website: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  vatNumber: string
  registrationNumber: string
  taxId: string
  logo_url: string
}


interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [activeModule, setActiveModule] = useState('general')
  const [isHydrated, setIsHydrated] = useState(false)

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null)
  const [isEditingGeneral, setIsEditingGeneral] = useState(false)
  const [tempGeneralSettings, setTempGeneralSettings] = useState<GeneralSettings | null>(null)

  // Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [showAYModal, setShowAYModal] = useState(false)
  const [editingAY, setEditingAY] = useState<AcademicYear | null>(null)
  const [ayFormData, setAYFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    status: 'Active',
    description: '',
    is_current: false,
  })

  // User Management State
  const [users, setUsers] = useState<User[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [userFormData, setUserFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'staff',
    password: '', // In real app, might auto-generate or send invite
  })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    } else if (isHydrated && user && token) {
      if (activeModule === 'general') {
        fetchGeneralSettings()
      } else if (activeModule === 'academic_years') {
        fetchAcademicYears()
      } else if (activeModule === 'users') {
        fetchUsers()
      }
    }
  }, [user, router, isHydrated, token, activeModule])

  const fetchGeneralSettings = async () => {
    try {
      const schoolId = user?.schoolId
      if (!schoolId) {
        console.log('No schoolId found')
        return
      }

      console.log('Fetching settings for school:', schoolId)
      const response = await schoolAPI.get(schoolId.toString())
      const data = response.data

      console.log('Received school data:', data)

      setGeneralSettings({
        schoolName: data.name || '',
        schoolCode: data.code || '',
        schoolType: data.school_type || 'School',
        email: data.email || '',
        phone: data.phone || '',
        alternatePhone: data.alternate_phone || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        zipCode: data.pincode || '',
        vatNumber: data.vat_number || '',
        registrationNumber: data.registration_number || '',
        taxId: data.tax_id || '',
        logo_url: data.logo_url || ''
      })
      console.log('General settings updated successfully')
    } catch (error: any) {
      console.error('Failed to fetch general settings:', error)
      toast.error(error.response?.data?.error || 'Failed to load settings')
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CLASS_SERVICE_URL}/api/v1/academic-years`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': user?.schoolId?.toString() || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAcademicYears(data)
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error)
      toast.error('Failed to load academic years')
    }
  }

  const fetchUsers = async () => {
    try {
      const schoolId = user?.schoolId
      if (!schoolId) return

      // Use user-service URL. Assuming it's available via env or proxy.
      // If not defined, fallback to localhost for dev or assume API gateway pattern
      const userServiceUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002'

      const response = await fetch(`${userServiceUrl}/api/v1/users/school/${schoolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    }
  }

  const handleSaveGeneralSettings = async () => {
    if (!tempGeneralSettings) return
    try {
      const schoolId = user?.schoolId
      if (!schoolId) return

      await schoolAPI.update(schoolId.toString(), {
        name: tempGeneralSettings.schoolName,
        school_type: tempGeneralSettings.schoolType,
        email: tempGeneralSettings.email,
        phone: tempGeneralSettings.phone,
        alternate_phone: tempGeneralSettings.alternatePhone,
        website: tempGeneralSettings.website,
        address: tempGeneralSettings.address,
        city: tempGeneralSettings.city,
        state: tempGeneralSettings.state,
        country: tempGeneralSettings.country,
        pincode: tempGeneralSettings.zipCode,
        vat_number: tempGeneralSettings.vatNumber,
        registration_number: tempGeneralSettings.registrationNumber,
        tax_id: tempGeneralSettings.taxId,
        logo_url: tempGeneralSettings.logo_url
      })

      setGeneralSettings(tempGeneralSettings)
      setIsEditingGeneral(false)
      toast.success('Settings saved successfully')
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      toast.error(error.response?.data?.error || 'Error saving settings')
    }
  }

  const handleSaveAY = async () => {
    try {
      const url = editingAY
        ? `${process.env.NEXT_PUBLIC_CLASS_SERVICE_URL}/api/v1/academic-years/${editingAY.id}`
        : `${process.env.NEXT_PUBLIC_CLASS_SERVICE_URL}/api/v1/academic-years`

      const method = editingAY ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': user?.schoolId?.toString() || ''
        },
        body: JSON.stringify(ayFormData)
      })

      if (response.ok) {
        fetchAcademicYears()
        setShowAYModal(false)
        setAYFormData({
          name: '',
          start_date: '',
          end_date: '',
          status: 'Active',
          description: '',
          is_current: false,
        })
        setEditingAY(null)
        toast.success(`Academic Year ${editingAY ? 'updated' : 'created'} successfully`)
      } else {
        toast.error('Failed to save academic year')
      }
    } catch (error) {
      console.error('Error saving academic year:', error)
      toast.error('An error occurred')
    }
  }

  const handleDeleteAY = async (id: string) => {
    if (!confirm('Are you sure you want to delete this academic year?')) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CLASS_SERVICE_URL}/api/v1/academic-years/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': user?.schoolId?.toString() || ''
        }
      })
      if (response.ok) {
        fetchAcademicYears()
        toast.success('Academic Year deleted')
      }
    } catch (error) {
      console.error('Error deleting academic year:', error)
      toast.error('Failed to delete')
    }
  }

  const handleCreateUser = async () => {
    try {
      const userServiceUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002'
      const response = await fetch(`${userServiceUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          school_id: user?.schoolId,
          ...userFormData
        })
      })

      if (response.ok) {
        fetchUsers()
        setShowUserModal(false)
        setUserFormData({
          first_name: '',
          last_name: '',
          email: '',
          role: 'staff',
          password: '',
        })
        toast.success('User created successfully')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('An error occurred')
    }
  }


  if (!isHydrated || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const modules = [
    { id: 'general', label: 'General Settings', icon: '⚙️' },
    { id: 'academic_years', label: 'Academic Years', icon: '📅' },
    { id: 'users', label: 'Users', icon: '👥' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex">
          {/* Settings Sidebar - Odoo Style */}
          <aside className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Settings</h2>
              <nav className="space-y-1">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeModule === module.id
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <span className="mr-3">{module.icon}</span>
                    {module.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {modules.find(m => m.id === activeModule)?.label}
                </h1>
              </div>

              {activeModule === 'general' && generalSettings && (
                <div className="space-y-6">
                  {/* Header with Edit/Save buttons */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">School Information</h2>
                      <p className="mt-1 text-sm text-gray-500">Manage your school's basic information and legal details</p>
                    </div>
                    {!isEditingGeneral ? (
                      <button
                        onClick={() => {
                          setTempGeneralSettings(generalSettings)
                          setIsEditingGeneral(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm"
                      >
                        ✏️ Edit Settings
                      </button>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setIsEditingGeneral(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveGeneralSettings}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm"
                        >
                          💾 Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Basic Information Card */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🏫</span> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.schoolName : generalSettings.schoolName}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, schoolName: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="Enter school name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
                        <input
                          type="text"
                          disabled={true}
                          value={generalSettings.schoolCode}
                          className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-50 text-gray-500 border p-2.5"
                          placeholder="Auto-generated"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Institution Type</label>
                        <select
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.schoolType : generalSettings.schoolType}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, schoolType: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                        >
                          <option value="School">School</option>
                          <option value="College">College</option>
                          <option value="Institute">Institute</option>
                          <option value="Academy">Academy</option>
                          <option value="University">University</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <input
                          type="url"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.website : generalSettings.website}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, website: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="https://www.example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Card */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📞</span> Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email *</label>
                        <input
                          type="email"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.email : generalSettings.email}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, email: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="contact@school.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone *</label>
                        <input
                          type="tel"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.phone : generalSettings.phone}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, phone: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="+977-XXX-XXXXXXX"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                        <input
                          type="tel"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.alternatePhone : generalSettings.alternatePhone}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, alternatePhone: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="Secondary contact number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information Card */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📍</span> Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.address : generalSettings.address}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, address: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="Street address, building number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.city : generalSettings.city}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, city: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="City name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.state : generalSettings.state}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, state: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="State or province"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.country : generalSettings.country}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, country: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="Country"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.zipCode : generalSettings.zipCode}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, zipCode: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="Postal code"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legal & Registration Card */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📄</span> Legal & Registration Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.vatNumber : generalSettings.vatNumber}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, vatNumber: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="VAT registration number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.registrationNumber : generalSettings.registrationNumber}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, registrationNumber: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="Company/School registration number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                        <input
                          type="text"
                          disabled={!isEditingGeneral}
                          value={isEditingGeneral ? tempGeneralSettings?.taxId : generalSettings.taxId}
                          onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, taxId: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 border p-2.5"
                          placeholder="Tax identification number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Section - Placeholder for now */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🖼️</span> Branding
                    </h3>
                    <div className="flex items-center space-x-4">
                      {generalSettings.logo_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={generalSettings.logo_url}
                            alt="School Logo"
                            className="h-20 w-20 object-contain border border-gray-200 rounded-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">School Logo</p>
                        <p className="text-xs text-gray-500">Logo upload functionality coming soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'academic_years' && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Academic Years List</h3>
                    <button
                      onClick={() => {
                        setEditingAY(null)
                        setAYFormData({
                          name: '',
                          start_date: '',
                          end_date: '',
                          status: 'Active',
                          description: '',
                          is_current: false,
                        })
                        setShowAYModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      + Add Academic Year
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {academicYears.map((ay) => (
                          <tr key={ay.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ay.name} {ay.is_current && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Current</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ay.start_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ay.end_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ay.status}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  setEditingAY(ay)
                                  setAYFormData({
                                    name: ay.name,
                                    start_date: ay.start_date,
                                    end_date: ay.end_date,
                                    status: ay.status,
                                    description: ay.description,
                                    is_current: ay.is_current
                                  })
                                  setShowAYModal(true)
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAY(ay.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModule === 'users' && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                    <button
                      onClick={() => setShowUserModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      + Create User
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {u.first_name} {u.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* API Modal (Academic Year) */}
      {showAYModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAY ? 'Edit Academic Year' : 'New Academic Year'}
              </h3>
              <button onClick={() => setShowAYModal(false)} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={ayFormData.name}
                  onChange={(e) => setAYFormData({ ...ayFormData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  placeholder="e.g. 2024-2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <NepaliDatePicker
                    label="Start Date"
                    value={ayFormData.start_date}
                    onChange={(val) => setAYFormData({ ...ayFormData, start_date: val })}
                    required
                  />
                </div>
                <div>
                  <NepaliDatePicker
                    label="End Date"
                    value={ayFormData.end_date}
                    onChange={(val) => setAYFormData({ ...ayFormData, end_date: val })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="is_current"
                  type="checkbox"
                  checked={ayFormData.is_current}
                  onChange={(e) => setAYFormData({ ...ayFormData, is_current: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_current" className="ml-2 block text-sm text-gray-900">
                  Set as Current Academic Year
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={ayFormData.description}
                  onChange={(e) => setAYFormData({ ...ayFormData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowAYModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAY}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={userFormData.first_name}
                    onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={userFormData.last_name}
                    onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
