import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import NepaliDatePicker from '@/components/NepaliDatePicker'

interface Guardian {
  id: string
  guardianId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone: string
  relationship: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed'
  occupation: string
  company: string
  income: number
  address: string
  city: string
  state: string
  zipCode: string
  linkedStudents: string
  communicationPreference: 'Email' | 'Phone' | 'Both'
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyRelationship: string
  status: 'Active' | 'Inactive'
  notes: string
  [key: string]: any
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone: string
  relationship: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed'
  occupation: string
  company: string
  income: number
  address: string
  city: string
  state: string
  zipCode: string
  linkedStudents: string
  communicationPreference: 'Email' | 'Phone' | 'Both'
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyRelationship: string
  status: 'Active' | 'Inactive'
  notes: string
}

const RELATIONSHIPS = [
  'Son',
  'Daughter',
  'Grandson',
  'Granddaughter',
  'Nephew',
  'Niece',
  'Adopted Son',
  'Adopted Daughter',
  'Step Son',
  'Step Daughter',
  'Cousin',
  'Ward',
  'Other',
]

const EMERGENCY_RELATIONSHIPS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Spouse',
  'Friend',
  'Other',
]

const DEFAULT_FORM_STATE: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  relationship: '',
  dateOfBirth: '',
  gender: 'Male',
  maritalStatus: 'Married',
  occupation: '',
  company: '',
  income: 0,
  address: '',
  city: '',
  state: '',
  zipCode: '',
  linkedStudents: '',
  communicationPreference: 'Both',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyRelationship: '',
  status: 'Active',
  notes: '',
}

export default function GuardiansPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)
  const [searchTerm, setSearchTerm] = useState('')

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
      const savedGuardians = localStorage.getItem('guardians')
      if (savedGuardians) {
        try {
          setGuardians(JSON.parse(savedGuardians))
        } catch (error) {
          console.error('Failed to load guardians:', error)
          setGuardians([])
        }
      }
      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('guardians', JSON.stringify(guardians))
    }
  }, [guardians, isHydrated])

  const generateGuardianId = () => {
    const currentYear = new Date().getFullYear()
    const maxExistingNumber = guardians.length > 0
      ? Math.max(...guardians.map(g => {
        const match = g.guardianId.match(/\d+$/)
        return match ? parseInt(match[0]) : 0
      }))
      : 0
    return `GRD${currentYear}${String(maxExistingNumber + 1).padStart(4, '0')}`
  }

  const handleAddGuardian = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setActiveTab('personal')
    setShowModal(true)
  }

  const handleEditGuardian = (guardian: Guardian) => {
    setEditingId(guardian.id)
    setFormData({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email,
      phone: guardian.phone,
      alternatePhone: guardian.alternatePhone,
      relationship: guardian.relationship,
      dateOfBirth: guardian.dateOfBirth,
      gender: guardian.gender,
      maritalStatus: guardian.maritalStatus,
      occupation: guardian.occupation,
      company: guardian.company,
      income: guardian.income,
      address: guardian.address,
      city: guardian.city,
      state: guardian.state,
      zipCode: guardian.zipCode,
      linkedStudents: guardian.linkedStudents,
      communicationPreference: guardian.communicationPreference,
      emergencyContactName: guardian.emergencyContactName,
      emergencyContactPhone: guardian.emergencyContactPhone,
      emergencyRelationship: guardian.emergencyRelationship,
      status: guardian.status,
      notes: guardian.notes,
    })
    setActiveTab('personal')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData(DEFAULT_FORM_STATE)
    setEditingId(null)
    setActiveTab('personal')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'income' ? parseFloat(value) || 0 : value,
    }))
  }

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Please enter first and last name')
      return false
    }
    if (!formData.email.trim()) {
      alert('Please enter email address')
      return false
    }
    if (!formData.phone.trim()) {
      alert('Please enter phone number')
      return false
    }
    if (!formData.relationship) {
      alert('Please select relationship to student')
      return false
    }
    return true
  }

  const handleSaveGuardian = () => {
    if (!validateForm()) return

    if (editingId) {
      // Update existing guardian
      setGuardians((prev) =>
        prev.map((g) =>
          g.id === editingId
            ? { ...g, ...formData }
            : g
        )
      )
    } else {
      // Add new guardian
      const newGuardian: Guardian = {
        id: Date.now().toString(),
        guardianId: generateGuardianId(),
        ...formData,
      }
      setGuardians((prev) => [newGuardian, ...prev])
    }

    handleCloseModal()
  }

  const handleDeleteGuardian = (id: string) => {
    if (confirm('Are you sure you want to delete this guardian?')) {
      setGuardians((prev) => prev.filter((g) => g.id !== id))
    }
  }

  const handleStatusChange = (id: string, newStatus: 'Active' | 'Inactive') => {
    setGuardians((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, status: newStatus } : g
      )
    )
  }

  const filteredGuardians = guardians.filter((g) =>
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.phone.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Guardians Management</h2>
            <button
              onClick={handleAddGuardian}
              className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors font-semibold shadow-md">
              + Add Guardian
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Guardians Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Guardian ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Relationship</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGuardians.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {guardians.length === 0 ? 'No guardians added yet. Click "Add Guardian" to get started.' : 'No matching guardians found.'}
                    </td>
                  </tr>
                ) : (
                  filteredGuardians.map((guardian) => (
                    <tr key={guardian.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">{guardian.guardianId}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {guardian.firstName} {guardian.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{guardian.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{guardian.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{guardian.relationship}</td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={guardian.status}
                          onChange={(e) => handleStatusChange(guardian.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border-0 ${guardian.status === 'Active'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() => handleEditGuardian(guardian)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGuardian(guardian.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Statistics */}
          {guardians.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg text-center border-l-4 border-blue-600">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Guardians</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{guardians.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg text-center border-l-4 border-green-600">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {guardians.filter((g) => g.status === 'Active').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg text-center border-l-4 border-red-600">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Inactive</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {guardians.filter((g) => g.status === 'Inactive').length}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Guardian Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Guardian' : 'Add New Guardian'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-3xl font-bold">
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`py-4 px-4 font-semibold transition-all border-b-2 ${activeTab === 'personal'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}>
                  Personal Info
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`py-4 px-4 font-semibold transition-all border-b-2 ${activeTab === 'contact'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}>
                  Contact Details
                </button>
                <button
                  onClick={() => setActiveTab('additional')}
                  className={`py-4 px-4 font-semibold transition-all border-b-2 ${activeTab === 'additional'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}>
                  Additional Info
                </button>
                <button
                  onClick={() => setActiveTab('emergency')}
                  className={`py-4 px-4 font-semibold transition-all border-b-2 ${activeTab === 'emergency'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}>
                  Emergency Contact
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relation to Student *</label>
                      <select
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select relationship</option>
                        {RELATIONSHIPS.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <NepaliDatePicker
                        label="Date of Birth"
                        value={formData.dateOfBirth}
                        onChange={(date: string) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter state/province"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter zip code"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Details Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
                    <input
                      type="tel"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter alternate phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Linked Students (comma separated)</label>
                    <input
                      type="text"
                      name="linkedStudents"
                      value={formData.linkedStudents}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., John Doe, Jane Doe"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter student names separated by commas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Communication Preference</label>
                    <select
                      name="communicationPreference"
                      value={formData.communicationPreference}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="Email">Email</option>
                      <option value="Phone">Phone</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Additional Info Tab */}
              {activeTab === 'additional' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter occupation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income (Optional)</label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">₹</span>
                      <input
                        type="number"
                        name="income"
                        value={formData.income}
                        onChange={handleInputChange}
                        min="0"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter annual income"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter any additional notes..."
                    />
                  </div>
                </div>
              )}

              {/* Emergency Contact Tab */}
              {activeTab === 'emergency' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Emergency Contact Information</h4>
                    <p className="text-sm text-gray-600">Please provide alternate contact information for emergency situations</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter emergency contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter emergency contact phone"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship to Guardian</label>
                    <select
                      name="emergencyRelationship"
                      value={formData.emergencyRelationship}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select relationship</option>
                      {EMERGENCY_RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Summary</h4>
                    <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                      <div className="flex justify-between">
                        <span>Guardian:</span>
                        <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="font-medium">{formData.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Primary Phone:</span>
                        <span className="font-medium">{formData.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Emergency Contact:</span>
                        <span className="font-medium">{formData.emergencyContactName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Students Linked:</span>
                        <span className="font-medium">{formData.linkedStudents || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-end gap-3 bg-white dark:bg-gray-800">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold">
                Cancel
              </button>
              <button
                onClick={handleSaveGuardian}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-semibold shadow-md">
                {editingId ? 'Update Guardian' : 'Save Guardian'}
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  )
}
