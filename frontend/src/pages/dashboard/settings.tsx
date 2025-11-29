import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import NepaliDatePicker from '@/components/NepaliDatePicker'

interface AcademicYear {
  id: string
  academicYear: string
  startDate: string
  endDate: string
  status: 'Active' | 'Inactive'
  createdBy: string
  createdDate: string
  description: string
}

interface GeneralSettings {
  schoolName: string
  schoolCode: string
  systemName: string
  systemLogo: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface AcademicYearFormData {
  academicYear: string
  startDate: string
  endDate: string
  status: 'Active' | 'Inactive'
  description: string
}

const DEFAULT_ACADEMIC_YEAR_FORM: AcademicYearFormData = {
  academicYear: '',
  startDate: '',
  endDate: '',
  status: 'Active',
  description: '',
}

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  schoolName: 'School ERP System',
  schoolCode: 'SCHOOL001',
  systemName: 'LAMA ERP',
  systemLogo: '',
  email: 'admin@schoolerp.com',
  phone: '+91-1234567890',
  address: '123 School Street',
  city: 'City',
  state: 'State',
  zipCode: '123456',
  country: 'India',
}

const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: '1',
    academicYear: '2024-2025',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'Active',
    createdBy: 'Admin',
    createdDate: '2024-04-01',
    description: 'Current Academic Year',
  },
  {
    id: '2',
    academicYear: '2023-2024',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    status: 'Inactive',
    createdBy: 'Admin',
    createdDate: '2023-04-01',
    description: 'Previous Academic Year',
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'academic-years'>('general')

  // Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [showAYModal, setShowAYModal] = useState(false)
  const [editingAYId, setEditingAYId] = useState<string | null>(null)
  const [ayFormData, setAYFormData] = useState<AcademicYearFormData>(DEFAULT_ACADEMIC_YEAR_FORM)
  const [aySearchTerm, setAYSearchTerm] = useState('')

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS)
  const [isEditingGeneral, setIsEditingGeneral] = useState(false)
  const [tempGeneralSettings, setTempGeneralSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/students', label: 'Students', icon: '👨‍🎓' },
    { href: '/dashboard/teachers', label: 'Teachers', icon: '👨‍🏫' },
    { href: '/dashboard/guardians', label: 'Guardians', icon: '👨‍👩‍👧' },
    { href: '/dashboard/staff', label: 'Staff', icon: '👔' },
    { href: '/dashboard/attendance', label: 'Attendance', icon: '📋' },
    { href: '/dashboard/fees', label: 'Fees', icon: '💰' },
    { href: '/dashboard/library', label: 'Library', icon: '📚' },
    { href: '/dashboard/classes', label: 'Classes', icon: '🏫' },
    { href: '/dashboard/school-buses', label: 'School Buses', icon: '🚌' },
    { href: '/dashboard/exams', label: 'Exams', icon: '📝' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ]

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAY = localStorage.getItem('academicYears')
      const savedGeneral = localStorage.getItem('generalSettings')

      if (savedAY) {
        try {
          setAcademicYears(JSON.parse(savedAY))
        } catch (error) {
          console.error('Failed to load academic years:', error)
          setAcademicYears(DEFAULT_ACADEMIC_YEARS)
        }
      } else {
        setAcademicYears(DEFAULT_ACADEMIC_YEARS)
      }

      if (savedGeneral) {
        try {
          const parsed = JSON.parse(savedGeneral)
          setGeneralSettings(parsed)
          setTempGeneralSettings(parsed)
        } catch (error) {
          console.error('Failed to load general settings:', error)
          setGeneralSettings(DEFAULT_GENERAL_SETTINGS)
          setTempGeneralSettings(DEFAULT_GENERAL_SETTINGS)
        }
      } else {
        setGeneralSettings(DEFAULT_GENERAL_SETTINGS)
        setTempGeneralSettings(DEFAULT_GENERAL_SETTINGS)
      }

      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('academicYears', JSON.stringify(academicYears))
      localStorage.setItem('generalSettings', JSON.stringify(generalSettings))
    }
  }, [academicYears, generalSettings, isHydrated])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    }
  }, [user, router, isHydrated])

  // Academic Years Handlers
  const handleAddAY = () => {
    setEditingAYId(null)
    setAYFormData(DEFAULT_ACADEMIC_YEAR_FORM)
    setShowAYModal(true)
  }

  const handleEditAY = (item: AcademicYear) => {
    setEditingAYId(item.id)
    setAYFormData({
      academicYear: item.academicYear,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
      description: item.description,
    })
    setShowAYModal(true)
  }

  const handleSaveAY = () => {
    if (!ayFormData.academicYear.trim() || !ayFormData.startDate || !ayFormData.endDate) {
      alert('Please fill in all required fields')
      return
    }

    const startDate = new Date(ayFormData.startDate)
    const endDate = new Date(ayFormData.endDate)

    if (startDate >= endDate) {
      alert('Start date must be before end date')
      return
    }

    if (editingAYId) {
      setAcademicYears((prev) =>
        prev.map((item) =>
          item.id === editingAYId
            ? {
              ...item,
              academicYear: ayFormData.academicYear,
              startDate: ayFormData.startDate,
              endDate: ayFormData.endDate,
              status: ayFormData.status,
              description: ayFormData.description,
            }
            : item
        )
      )
    } else {
      const newAY: AcademicYear = {
        id: Date.now().toString(),
        academicYear: ayFormData.academicYear,
        startDate: ayFormData.startDate,
        endDate: ayFormData.endDate,
        status: ayFormData.status,
        createdBy: user?.email || 'Unknown',
        createdDate: new Date().toISOString().split('T')[0],
        description: ayFormData.description,
      }
      setAcademicYears((prev) => [newAY, ...prev])
    }

    setShowAYModal(false)
    setAYFormData(DEFAULT_ACADEMIC_YEAR_FORM)
  }

  const handleDeleteAY = (id: string) => {
    if (confirm('Are you sure you want to delete this academic year?')) {
      setAcademicYears((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleActivateAY = (id: string) => {
    setAcademicYears((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'Active' }
          : item.status === 'Active'
            ? { ...item, status: 'Inactive' }
            : item
      )
    )
  }

  const handleSaveGeneralSettings = () => {
    setGeneralSettings(tempGeneralSettings)
    // Save to localStorage for navbar
    if (typeof window !== 'undefined') {
      localStorage.setItem('system_name', tempGeneralSettings.systemName)
      localStorage.setItem('system_logo', tempGeneralSettings.systemLogo)
    }
    setIsEditingGeneral(false)
    alert('Settings saved successfully! The changes will be visible after page refresh.')
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadingLogo(true)

    const reader = new FileReader()
    reader.onloadend = () => {
      setTempGeneralSettings({ ...tempGeneralSettings, systemLogo: reader.result as string })
      setUploadingLogo(false)
    }
    reader.onerror = () => {
      alert('Failed to read file')
      setUploadingLogo(false)
    }
    reader.readAsDataURL(file)
  }

  const filteredYears = academicYears.filter((item) =>
    item.academicYear.toLowerCase().includes(aySearchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(aySearchTerm.toLowerCase())
  )

  const activeYears = academicYears.filter((item) => item.status === 'Active').length
  const totalYears = academicYears.length
  const currentYear = academicYears.find((item) => item.status === 'Active')

  if (!isHydrated || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h2>
            <p className="text-gray-600 mb-8">Manage school configuration and system settings</p>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'general'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  General Settings
                </button>
                <button
                  onClick={() => setActiveTab('academic-years')}
                  className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'academic-years'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Academic Years
                </button>
              </div>

              {/* General Settings Tab */}
              {activeTab === 'general' && (
                <div className="p-6">
                  {!isEditingGeneral ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">System Name</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.systemName}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">System Logo</h3>
                          {generalSettings.systemLogo ? (
                            <img src={generalSettings.systemLogo} alt="System Logo" className="h-12 w-12 object-contain mt-2" />
                          ) : (
                            <p className="text-sm text-gray-500 mt-2">No logo uploaded</p>
                          )}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">School Name</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.schoolName}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">School Code</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.schoolCode}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">Email</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.email}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">Phone</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.phone}</p>
                        </div>
                        <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">Address</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.address}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">City</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.city}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">State</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.state}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">Zip Code</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.zipCode}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-500 mb-1">Country</h3>
                          <p className="text-lg font-bold text-gray-900">{generalSettings.country}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsEditingGeneral(true)
                          setTempGeneralSettings(generalSettings)
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                      >
                        Edit Settings
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">System Name</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.systemName}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, systemName: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., LAMA ERP"
                          />
                          <p className="text-xs text-gray-500 mt-1">This appears in the navigation bar</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">System Logo</label>
                          {tempGeneralSettings.systemLogo && (
                            <div className="mb-3">
                              <img
                                src={tempGeneralSettings.systemLogo}
                                alt="System logo preview"
                                className="h-20 w-20 object-contain rounded-lg border border-gray-300"
                              />
                            </div>
                          )}
                          <label
                            htmlFor="system-logo-upload"
                            className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-center inline-block ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                          >
                            {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                            <input
                              id="system-logo-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={uploadingLogo}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">Max 5MB. This appears in the navigation bar</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">School Name</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.schoolName}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, schoolName: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">School Code</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.schoolCode}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, schoolCode: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={tempGeneralSettings.email}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, email: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.phone}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, phone: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.address}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, address: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.city}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, city: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.state}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, state: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.zipCode}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, zipCode: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                          <input
                            type="text"
                            value={tempGeneralSettings.country}
                            onChange={(e) =>
                              setTempGeneralSettings({ ...tempGeneralSettings, country: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsEditingGeneral(false)}
                          className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveGeneralSettings}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                        >
                          Save Settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Academic Years Tab */}
              {activeTab === 'academic-years' && (
                <div className="p-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-gray-600 text-sm font-medium">Total Academic Years</h3>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{totalYears}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                      <h3 className="text-gray-600 text-sm font-medium">Active Years</h3>
                      <p className="text-3xl font-bold text-green-600 mt-2">{activeYears}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                      <h3 className="text-gray-600 text-sm font-medium">Current Year</h3>
                      <p className="text-2xl font-bold text-purple-600 mt-2">{currentYear?.academicYear || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Search and Actions */}
                  <div className="flex justify-between items-center gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Search academic years..."
                      value={aySearchTerm}
                      onChange={(e) => setAYSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddAY}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
                    >
                      + Add New
                    </button>
                  </div>

                  {/* Academic Years Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Academic Year</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">End Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredYears.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No academic years found
                            </td>
                          </tr>
                        ) : (
                          filteredYears.map((item) => (
                            <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.academicYear}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.startDate}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.endDate}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.description}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleEditAY(item)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold transition"
                                  >
                                    Edit
                                  </button>
                                  {item.status !== 'Active' && (
                                    <button
                                      onClick={() => handleActivateAY(item.id)}
                                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs font-semibold transition"
                                    >
                                      Activate
                                    </button>
                                  )}
                                  {item.status === 'Active' && academicYears.filter((a) => a.status === 'Active').length > 1 && (
                                    <button
                                      onClick={() => handleActivateAY(item.id)}
                                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs font-semibold transition"
                                    >
                                      Deactivate
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteAY(item.id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
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

      {/* Academic Year Modal */}
      {showAYModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAYId ? 'Edit Academic Year' : 'Add New Academic Year'}
              </h3>
              <button
                onClick={() => setShowAYModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Academic Year <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2024-2025"
                  value={ayFormData.academicYear}
                  onChange={(e) => setAYFormData({ ...ayFormData, academicYear: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <NepaliDatePicker
                  label="Start Date"
                  value={ayFormData.startDate}
                  onChange={(date: string) => setAYFormData({ ...ayFormData, startDate: date })}
                  required
                />
              </div>

              <div>
                <NepaliDatePicker
                  label="End Date"
                  value={ayFormData.endDate}
                  onChange={(date: string) => setAYFormData({ ...ayFormData, endDate: date })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={ayFormData.status}
                  onChange={(e) => setAYFormData({ ...ayFormData, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Enter description (optional)"
                  value={ayFormData.description}
                  onChange={(e) => setAYFormData({ ...ayFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAYModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAY}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
