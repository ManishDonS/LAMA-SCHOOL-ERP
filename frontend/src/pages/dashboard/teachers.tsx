import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import { schoolAPI } from '@/services/api'
import NepaliDatePicker from '@/components/NepaliDatePicker'

interface Teacher {
  id: string
  teacherId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  qualification: string
  specialization: string
  experience: number
  joiningDate: string
  employmentType: 'Full-time' | 'Part-time' | 'Contract'
  salary: number
  status: 'Active' | 'Inactive' | 'On Leave'
  classAssigned: string
  subject: string
  address: string
  city: string
  state: string
  [key: string]: any
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  qualification: string
  specialization: string
  experience: number
  joiningDate: string
  employmentType: 'Full-time' | 'Part-time' | 'Contract'
  salary: number
  status: 'Active' | 'Inactive' | 'On Leave'
  classAssigned: string
  subject: string
  address: string
  city: string
  state: string
  schoolId?: string // Optional for super admin
}

const QUALIFICATIONS = [
  'B.A.',
  'B.Sc.',
  'B.Com.',
  'B.Ed.',
  'M.A.',
  'M.Sc.',
  'M.Com.',
  'M.Ed.',
  'Ph.D.',
  'Diploma',
]

const SPECIALIZATIONS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Physical Education',
  'Art & Design',
  'Music',
  'Languages',
  'Business Studies',
  'Economics',
]

const DEFAULT_FORM_STATE: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'Male',
  qualification: '',
  specialization: '',
  experience: 0,
  joiningDate: new Date().toISOString().split('T')[0],
  employmentType: 'Full-time',
  salary: 0,
  status: 'Active',
  classAssigned: '',
  subject: '',
  address: '',
  city: '',
  state: '',
}

export default function TeachersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin'

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
      const savedTeachers = localStorage.getItem('teachers')
      if (savedTeachers) {
        try {
          setTeachers(JSON.parse(savedTeachers))
        } catch (error) {
          console.error('Failed to load teachers:', error)
          setTeachers([])
        }
      }
      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('teachers', JSON.stringify(teachers))
    }
  }, [teachers, isHydrated])

  // Fetch schools for super admin
  useEffect(() => {
    const fetchSchools = async () => {
      if (isSuperAdmin) {
        try {
          const response = await schoolAPI.list()
          setSchools(response.data.data || [])
        } catch (error) {
          console.error('Failed to fetch schools:', error)
        }
      }
    }
    fetchSchools()
  }, [isSuperAdmin])

  const generateTeacherId = () => {
    const currentYear = new Date().getFullYear()
    const maxExistingNumber = teachers.length > 0
      ? Math.max(...teachers.map(t => {
        const match = t.teacherId.match(/\d+$/)
        return match ? parseInt(match[0]) : 0
      }))
      : 0
    return `TCH${currentYear}${String(maxExistingNumber + 1).padStart(4, '0')}`
  }

  const handleAddTeacher = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setActiveTab('personal')
    setShowModal(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingId(teacher.id)
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      dateOfBirth: teacher.dateOfBirth,
      gender: teacher.gender,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      experience: teacher.experience,
      joiningDate: teacher.joiningDate,
      employmentType: teacher.employmentType,
      salary: teacher.salary,
      status: teacher.status,
      classAssigned: teacher.classAssigned,
      subject: teacher.subject,
      address: teacher.address,
      city: teacher.city,
      state: teacher.state,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience' || name === 'salary' ? parseFloat(value) || 0 : value,
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
    if (!formData.qualification) {
      alert('Please select qualification')
      return false
    }
    if (!formData.specialization) {
      alert('Please select specialization')
      return false
    }
    return true
  }

  const handleSaveTeacher = () => {
    if (!validateForm()) return

    if (editingId) {
      // Update existing teacher
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, ...formData }
            : t
        )
      )
    } else {
      // Add new teacher
      const newTeacher: Teacher = {
        id: Date.now().toString(),
        teacherId: generateTeacherId(),
        ...formData,
      }
      setTeachers((prev) => [newTeacher, ...prev])
    }

    handleCloseModal()
  }

  const handleDeleteTeacher = (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      setTeachers((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const handleStatusChange = (id: string, newStatus: 'Active' | 'Inactive' | 'On Leave') => {
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: newStatus } : t
      )
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Teachers Management</h2>
            <button
              onClick={handleAddTeacher}
              className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors font-semibold shadow-md">
              + Add Teacher
            </button>
          </div>

          {/* Teachers Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Teacher ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No teachers added yet. Click "Add Teacher" to get started.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">{teacher.teacherId}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.firstName} {teacher.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.subject || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.classAssigned || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={teacher.status}
                          onChange={(e) => handleStatusChange(teacher.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border-0 ${teacher.status === 'Active'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : teacher.status === 'On Leave'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                        >
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() => handleEditTeacher(teacher)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
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
          {teachers.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg text-center border-l-4 border-blue-600">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Teachers</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{teachers.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg text-center border-l-4 border-green-600">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {teachers.filter((t) => t.status === 'Active').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg text-center border-l-4 border-yellow-600">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">On Leave</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {teachers.filter((t) => t.status === 'On Leave').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg text-center border-l-4 border-red-600">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Inactive</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {teachers.filter((t) => t.status === 'Inactive').length}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl h-[85vh] max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Teacher' : 'Add New Teacher'}
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
                  onClick={() => setActiveTab('professional')}
                  className={`py-4 px-4 font-semibold transition-all border-b-2 ${activeTab === 'professional'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}>
                  Professional Details
                </button>
                <button
                  onClick={() => setActiveTab('assignment')}
                  className={`py-4 px-4 font-semibold transition-all border-b-2 ${activeTab === 'assignment'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}>
                  Class Assignment
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  {/* School Selector for Super Admin */}
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select School *
                      </label>
                      <select
                        name="schoolId"
                        value={formData.schoolId || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Select a School --</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name} ({school.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
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

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <NepaliDatePicker
                        label="Date of Birth"
                        value={formData.dateOfBirth}
                        onChange={(date: string) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
                      />
                    </div>
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

                  <div className="grid grid-cols-2 gap-6">
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
                  </div>
                </div>
              )}

              {/* Professional Details Tab */}
              {activeTab === 'professional' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Qualification *</label>
                      <select
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select qualification</option>
                        {QUALIFICATIONS.map((qual) => (
                          <option key={qual} value={qual}>
                            {qual}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select specialization</option>
                        {SPECIALIZATIONS.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        min="0"
                        max="60"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter years of experience"
                      />
                    </div>
                    <div>
                      <NepaliDatePicker
                        label="Joining Date"
                        value={formData.joiningDate}
                        onChange={(date: string) => setFormData(prev => ({ ...prev, joiningDate: date }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                      <select
                        name="employmentType"
                        value={formData.employmentType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salary (Monthly)</label>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">₹</span>
                        <input
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          min="0"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter monthly salary"
                        />
                      </div>
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
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Class Assignment Tab */}
              {activeTab === 'assignment' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class Assigned</label>
                    <input
                      type="text"
                      name="classAssigned"
                      value={formData.classAssigned}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Class 10-A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject to Teach</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select subject</option>
                      {SPECIALIZATIONS.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">
                          {formData.firstName} {formData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Qualification:</span>
                        <span className="font-medium text-gray-900">{formData.qualification || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Specialization:</span>
                        <span className="font-medium text-gray-900">{formData.specialization || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium text-gray-900">{formData.experience} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Class Assigned:</span>
                        <span className="font-medium text-gray-900">{formData.classAssigned || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject:</span>
                        <span className="font-medium text-gray-900">{formData.subject || '-'}</span>
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
                onClick={handleSaveTeacher}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-semibold shadow-md">
                {editingId ? 'Update Teacher' : 'Save Teacher'}
              </button>
            </div>
          </div>
        </div >
      )
      }
    </div >
  )
}
