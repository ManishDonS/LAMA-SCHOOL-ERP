import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import { schoolAPI, userAPI, classAPI } from '@/services/api'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { toast } from 'react-hot-toast'
import { useSettingsStore } from '@/store/settingsStore'
import FormattedDate from '@/components/common/FormattedDate'

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
  employee_id?: string
  student_id_number?: string
  guardian_id?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const { dateFormat, toggleDateFormat } = useSettingsStore()
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [userFormData, setUserFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'staff',
    password: '',
    employee_id: '',
    department: '',
  })

  // Logo Upload State
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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
      const response = await classAPI.listAY()
      if (response.data) {
        setAcademicYears(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error)
      toast.error('Failed to load academic years')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await userAPI.list()
      if (response.data) {
        setUsers(response.data.users || [])
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PNG, JPG, JPEG, and SVG are allowed')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit')
      return
    }

    const schoolId = user?.schoolId
    if (!schoolId) return

    setIsUploadingLogo(true)
    try {
      const response = await schoolAPI.uploadLogo(schoolId.toString(), file)
      const logoURL = response.data.logo_url

      // Update general settings with new logo URL
      setGeneralSettings(prev => prev ? { ...prev, logo_url: logoURL } : null)
      setTempGeneralSettings(prev => prev ? { ...prev, logo_url: logoURL } : null)

      // Update localStorage so Navbar reflects the change immediately
      if (typeof window !== 'undefined') {
        const selectedSchoolStr = localStorage.getItem('selected_school')
        if (selectedSchoolStr) {
          try {
            const selectedSchool = JSON.parse(selectedSchoolStr)
            selectedSchool.logo_url = logoURL
            localStorage.setItem('selected_school', JSON.stringify(selectedSchool))
            // Trigger a storage event to notify other components
            window.dispatchEvent(new Event('storage'))
          } catch (e) {
            console.error('Failed to update selected_school in localStorage', e)
          }
        }
      }

      toast.success('Logo uploaded successfully')
    } catch (error: any) {
      console.error('Failed to upload logo:', error)
      toast.error(error.response?.data?.error || 'Failed to upload logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleLogoDelete = async () => {
    const schoolId = user?.schoolId
    if (!schoolId) return

    if (!confirm('Are you sure you want to remove the school logo?')) return

    try {
      await schoolAPI.deleteLogo(schoolId.toString())

      // Update general settings to remove logo URL
      setGeneralSettings(prev => prev ? { ...prev, logo_url: '' } : null)
      setTempGeneralSettings(prev => prev ? { ...prev, logo_url: '' } : null)

      toast.success('Logo removed successfully')
    } catch (error: any) {
      console.error('Failed to delete logo:', error)
      toast.error(error.response?.data?.error || 'Failed to remove logo')
    }
  }

  const handleSaveAY = async () => {
    try {
      const response = editingAY
        ? await classAPI.updateAY(editingAY.id, ayFormData)
        : await classAPI.createAY(ayFormData)

      if (response.status === 200 || response.status === 201) {
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
      const response = await classAPI.deleteAY(id)
      if (response.status === 200 || response.status === 204) {
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
      const response = await userAPI.create({
        school_id: user?.schoolId,
        ...userFormData
      })

      if (response.status === 200 || response.status === 201) {
        fetchUsers()
        setShowUserModal(false)
        setUserFormData({
          first_name: '',
          last_name: '',
          email: '',
          role: 'staff',
          password: '',
          employee_id: '',
          department: '',
        })
        toast.success('User created successfully')
      } else {
        toast.error('Failed to create user')
      }
    } catch (error: any) {
      console.error('Error creating user:', error)
      const errorMessage = error.response?.data?.error || 'An error occurred'
      toast.error(errorMessage)
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
            <div className="w-full">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {modules.find(m => m.id === activeModule)?.label}
                </h1>
              </div>

              {activeModule === 'general' && generalSettings && (
                <div className="space-y-6">
                  {/* Header with Edit/Save buttons */}
                  {/* Header with Logo and School Name */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          {/* Logo */}
                          <div className="relative group">
                            {generalSettings.logo_url ? (
                              <div className="relative">
                                <img
                                  src={`${process.env.NEXT_PUBLIC_SCHOOL_API_URL}${generalSettings.logo_url}`}
                                  alt="School Logo"
                                  className="h-24 w-24 object-contain border-2 border-gray-200 rounded-lg bg-white p-2"
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_SCHOOL_API_URL}${generalSettings.logo_url}`, '_blank')}
                                    className="px-2 py-1 bg-white text-gray-700 rounded text-xs font-medium hover:bg-gray-100"
                                  >
                                    👁️
                                  </button>
                                  <label className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 cursor-pointer">
                                    🔄
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                      onChange={handleLogoUpload}
                                      disabled={isUploadingLogo}
                                    />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="block cursor-pointer group">
                                <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg group-hover:border-blue-500 group-hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500">
                                  <span className="text-2xl mb-1">📷</span>
                                  <span className="text-[10px] font-medium">Add Logo</span>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                  onChange={handleLogoUpload}
                                  disabled={isUploadingLogo}
                                />
                              </label>
                            )}
                          </div>

                          {/* School Name and Quick Stats */}
                          <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                              {generalSettings.schoolName || 'School Name'}
                            </h2>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              {generalSettings.schoolCode && (
                                <span className="flex items-center">
                                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600 mr-2">CODE</span>
                                  {generalSettings.schoolCode}
                                </span>
                              )}
                              {generalSettings.schoolType && (
                                <span className="flex items-center">
                                  <span className="w-1 h-1 bg-gray-300 rounded-full mx-2"></span>
                                  {generalSettings.schoolType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Edit/Save Buttons */}
                        <div>
                          {!isEditingGeneral ? (
                            <button
                              onClick={() => {
                                setTempGeneralSettings(generalSettings)
                                setIsEditingGeneral(true)
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm flex items-center"
                            >
                              <span className="mr-2">✏️</span> Edit Information
                            </button>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setIsEditingGeneral(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveGeneralSettings}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm flex items-center"
                              >
                                <span className="mr-2">💾</span> Save Changes
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="border-b border-gray-200 bg-gray-50 px-6">
                      <nav className="flex space-x-8" aria-label="Tabs">
                        <button className="border-b-2 border-blue-600 py-4 px-1 text-sm font-medium text-blue-600 flex items-center">
                          <span className="mr-2">📝</span> General Information
                        </button>
                      </nav>
                    </div>

                    {/* Form Content */}
                    <div className="p-8">
                      <div className="grid grid-cols-12 gap-8">
                        {/* Left Column: Primary Details */}
                        <div className="col-span-12 md:col-span-6 space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Identity & Contact</h4>

                            {/* School Name */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                School / Organization Name <span className="text-red-500">*</span>
                              </label>
                              {isEditingGeneral ? (
                                <input
                                  type="text"
                                  value={tempGeneralSettings?.schoolName}
                                  onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, schoolName: e.target.value })}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                              ) : (
                                <p className="text-gray-900 font-medium">{generalSettings.schoolName}</p>
                              )}
                            </div>

                            {/* Email & Phone */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                {isEditingGeneral ? (
                                  <input
                                    type="email"
                                    value={tempGeneralSettings?.email}
                                    onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, email: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  />
                                ) : (
                                  <p className="text-gray-900">{generalSettings.email || '-'}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                {isEditingGeneral ? (
                                  <input
                                    type="tel"
                                    value={tempGeneralSettings?.phone}
                                    onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, phone: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  />
                                ) : (
                                  <p className="text-gray-900">{generalSettings.phone || '-'}</p>
                                )}
                              </div>
                            </div>

                            {/* Website */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                              {isEditingGeneral ? (
                                <div className="mt-1 flex rounded-md shadow-sm">
                                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    https://
                                  </span>
                                  <input
                                    type="text"
                                    value={tempGeneralSettings?.website?.replace('https://', '')}
                                    onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, website: `https://${e.target.value}` })}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                                </div>
                              ) : (
                                <a href={generalSettings.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                                  {generalSettings.website || '-'}
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Legal Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / PAN</label>
                                {isEditingGeneral ? (
                                  <input
                                    type="text"
                                    value={tempGeneralSettings?.taxId}
                                    onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, taxId: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                                  />
                                ) : (
                                  <p className="text-gray-900">{generalSettings.taxId || '-'}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                                {isEditingGeneral ? (
                                  <input
                                    type="text"
                                    value={tempGeneralSettings?.vatNumber}
                                    onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, vatNumber: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                                  />
                                ) : (
                                  <p className="text-gray-900">{generalSettings.vatNumber || '-'}</p>
                                )}
                              </div>
                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration No.</label>
                                {isEditingGeneral ? (
                                  <input
                                    type="text"
                                    value={tempGeneralSettings?.registrationNumber}
                                    onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, registrationNumber: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                                  />
                                ) : (
                                  <p className="text-gray-900">{generalSettings.registrationNumber || '-'}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Address & Type */}
                        <div className="col-span-12 md:col-span-6 space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Location</h4>

                            {/* Address Fields */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                {isEditingGeneral ? (
                                  <input
                                    type="text"
                                    value={tempGeneralSettings?.address}
                                    onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, address: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  />
                                ) : (
                                  <p className="text-gray-900">{generalSettings.address || '-'}</p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                  {isEditingGeneral ? (
                                    <input
                                      type="text"
                                      value={tempGeneralSettings?.city}
                                      onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, city: e.target.value })}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="text-gray-900">{generalSettings.city || '-'}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                                  {isEditingGeneral ? (
                                    <input
                                      type="text"
                                      value={tempGeneralSettings?.state}
                                      onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, state: e.target.value })}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="text-gray-900">{generalSettings.state || '-'}</p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Info</label>
                                  {isEditingGeneral ? (
                                    <input
                                      type="text"
                                      value={tempGeneralSettings?.zipCode}
                                      onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, zipCode: e.target.value })}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="text-gray-900">{generalSettings.zipCode || '-'}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                  {isEditingGeneral ? (
                                    <input
                                      type="text"
                                      value={tempGeneralSettings?.country}
                                      onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, country: e.target.value })}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="text-gray-900">{generalSettings.country || '-'}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Configurations</h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Type</label>
                                {isEditingGeneral ? (
                                  <select
                                    value={tempGeneralSettings?.schoolType}
                                    onChange={(e) => setTempGeneralSettings({ ...tempGeneralSettings!, schoolType: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  >
                                    <option value="School">School</option>
                                    <option value="College">College</option>
                                    <option value="University">University</option>
                                    <option value="Institute">Institute</option>
                                    <option value="Academy">Academy</option>
                                  </select>
                                ) : (
                                  <p className="text-gray-900">{generalSettings.schoolType || 'School'}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">System Code</label>
                                <code className="bg-gray-200 px-2 py-1 rounded text-xs text-gray-800 font-mono">
                                  {generalSettings.schoolCode}
                                </code>
                              </div>
                              {/* Display Date Format - Only if nepali_date module is active */}
                              {useAuthStore.getState().activeModules.includes('nepali_date') && (
                                <div className="pt-4 border-t border-gray-100">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Date Format</label>
                                  <button
                                    onClick={toggleDateFormat}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFormat === 'BS'
                                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                                      }`}
                                  >
                                    <span className="mr-2">{dateFormat === 'BS' ? '🇳🇵 BS (Nepali)' : '🌐 AD (English)'}</span>
                                    <span className="text-[10px] bg-white bg-opacity-50 px-1.5 py-0.5 rounded ml-auto">Click to switch</span>
                                  </button>
                                  <p className="mt-1.5 text-xs text-gray-500 italic">
                                    Current format: {dateFormat === 'BS' ? 'Bikram Sambat' : 'Anno Domini'}. This applies to all dates across the system.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <FormattedDate date={ay.start_date} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <FormattedDate date={ay.end_date} />
                            </td>
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
                    <div className="flex space-x-4">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          🔍
                        </span>
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                      </div>
                      <button
                        onClick={() => setShowUserModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm flex items-center"
                      >
                        + Create User
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.filter(u =>
                          u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {u.first_name} {u.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {u.employee_id || '-'}
                            </td>
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
                        {users.filter(u =>
                          u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 && (
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
              <div className="grid grid-cols-2 gap-4">
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
                {(userFormData.role === 'teacher' || userFormData.role === 'staff') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <input
                      type="text"
                      value={userFormData.employee_id}
                      onChange={(e) => setUserFormData({ ...userFormData, employee_id: e.target.value })}
                      placeholder="e.g. EMP001"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                  </div>
                )}
              </div>
              {(userFormData.role === 'teacher' || userFormData.role === 'staff') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    value={userFormData.department}
                    onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                    placeholder="e.g. Science, HR"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>
              )}
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
