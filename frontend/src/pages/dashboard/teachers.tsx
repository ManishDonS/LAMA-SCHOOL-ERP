import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import { schoolAPI, teacherAPI } from '@/services/api'
import NepaliDatePicker from '@/components/NepaliDatePicker'

interface Teacher {
  id: string
  user_id?: string
  first_name?: string
  last_name?: string

  // Frontend/Backend mapping helpers
  firstName?: string
  lastName?: string

  email: string
  phone?: string
  dateOfBirth?: string
  gender?: 'Male' | 'Female' | 'Other'
  qualification: string
  specialization?: string
  experience?: number
  joiningDate?: string // Backend uses join_date
  join_date?: string
  employmentType?: 'Full-time' | 'Part-time' | 'Contract'
  salary?: number
  status: 'Active' | 'Inactive' | 'On Leave' | 'active' | 'inactive'
  classAssigned?: string
  subject?: string
  address?: string
  city?: string
  state?: string
  department?: string
  employee_id?: string
  teacherId?: string // Alias for employee_id
  [key: string]: any
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  password?: string // Added for creation
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  qualification: string
  specialization: string
  experience: number
  joiningDate: string
  employmentType: 'Full-time' | 'Part-time' | 'Contract'
  salary: number
  status: 'Active' | 'Inactive' | 'On Leave' | 'active' | 'inactive'
  classAssigned: string
  subject: string
  address: string
  city: string
  state: string
  schoolId?: string // Optional for super admin
  department: string
  employeeId: string
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
  password: '',
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
  department: '',
  employeeId: '',
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
  const [loading, setLoading] = useState(false)

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin'

  // Load teachers from API
  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await teacherAPI.list()
      // Map backend response if needed or use directly
      // Backend returns: { teachers: [...] }
      const fetchedTeachers = response.data.teachers || []

      // Map backend fields to frontend interface if mismatched
      const mappedTeachers = fetchedTeachers.map((t: any) => ({
        ...t,
        firstName: t.first_name || 'N/A', // Assuming backend might not populate user details in the list view yet
        lastName: t.last_name || '',
        teacherId: t.employee_id,
        // Add other mappings as the backend evolves to return joined User data
      }))

      setTeachers(mappedTeachers)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsHydrated(true)
    fetchTeachers()
  }, [])

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
    // This is now just a helper suggestion, ID is handled by user input usually or backend
    const currentYear = new Date().getFullYear()
    return `TCH${currentYear}-${Math.floor(Math.random() * 10000)}`
  }

  const handleAddTeacher = () => {
    setEditingId(null)
    setFormData({
      ...DEFAULT_FORM_STATE,
      employeeId: generateTeacherId(),
      password: 'password123', // Default or random
    })
    setActiveTab('personal')
    setShowModal(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingId(teacher.id)
    setFormData({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      dateOfBirth: teacher.dateOfBirth || '',
      gender: teacher.gender || 'Male',
      qualification: teacher.qualification || '',
      specialization: teacher.specialization || '',
      experience: teacher.experience || 0,
      joiningDate: teacher.join_date || teacher.joiningDate || '',
      employmentType: teacher.employmentType || 'Full-time',
      salary: teacher.salary || 0,
      status: teacher.status || 'Active',
      classAssigned: teacher.classAssigned || '',
      subject: teacher.subject || '',
      address: teacher.address || '',
      city: teacher.city || '',
      state: teacher.state || '',
      department: teacher.department || '',
      employeeId: teacher.employee_id || teacher.teacherId || '',
      password: '', // Don't fill password on edit
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
    if (!formData.qualification) {
      alert('Please select qualification')
      return false
    }
    if (!formData.employeeId) {
      alert('Employee ID is required')
      return false
    }
    return true
  }

  const handleSaveTeacher = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      // Prepare payload for backend
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password || 'Welcome@123',
        school_id: formData.schoolId || '1', // Default or from context? Assuming 1 if not SuperAdmin
        qualification: formData.qualification,
        department: formData.department || 'General',
        employee_id: formData.employeeId,
        // Add other fields if backend supports them later
      }

      // Use School Code from local storage if not super admin
      if (!isSuperAdmin) {
        const selectedSchoolStr = localStorage.getItem('selected_school')
        if (selectedSchoolStr) {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          payload.school_id = selectedSchool.id.toString()
        }
      }

      if (editingId) {
        // Update existing teacher (Not fully implemented on backend yet maybe, but API exists)
        await teacherAPI.update(editingId, payload)
      } else {
        // Add new teacher
        await teacherAPI.create(payload)
      }

      await fetchTeachers()
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save teacher:', error)
      alert('Failed to save teacher. ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      try {
        await teacherAPI.delete(id)
        await fetchTeachers()
      } catch (error) {
        console.error('Failed to delete teacher:', error)
        alert('Failed to delete teacher')
      }
    }
  }

  const handleStatusChange = (id: string, newStatus: 'Active' | 'Inactive' | 'On Leave') => {
    // Optimistic update or API call if supported
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
            {loading && <div className="p-4 text-center">Loading...</div>}

            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Employee ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Qualification</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Join Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {!loading && teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No teachers added yet. Click "Add Teacher" to get started.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">{teacher.employee_id || teacher.teacherId}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.firstName} {teacher.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.qualification}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.department || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.join_date ? new Date(teacher.join_date).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={teacher.status}
                          onChange={(e) => handleStatusChange(teacher.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border-0 ${teacher.status === 'active' || teacher.status === 'Active'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : teacher.status === 'On Leave'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                        >
                          <option value="active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="inactive">Inactive</option>
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

          {/* Statistics - Simplified for now based on available data */}
          {teachers.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-lg text-center border-l-4 border-blue-600">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Teachers</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{teachers.length}</p>
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
                  Professional & Dept
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={!!editingId}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder={editingId ? 'Unchanged' : 'Enter password'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="TCH-XXXX"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Science"
                      />
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
                disabled={loading}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-semibold shadow-md disabled:bg-gray-400">
                {loading ? 'Saving...' : (editingId ? 'Update Teacher' : 'Save Teacher')}
              </button>
            </div>
          </div>
        </div >
      )
      }
    </div >
  )
}
