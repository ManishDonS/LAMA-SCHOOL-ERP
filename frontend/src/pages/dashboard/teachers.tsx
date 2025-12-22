import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import { schoolAPI, teacherAPI } from '@/services/api'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { toast } from 'react-hot-toast'
import FormattedDate from '@/components/common/FormattedDate'

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
  password?: string
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
  schoolId?: string
  department: string
  employeeId: string
}

const QUALIFICATIONS = [
  'B.A.', 'B.Sc.', 'B.Com.', 'B.Ed.', 'M.A.', 'M.Sc.', 'M.Com.', 'M.Ed.', 'Ph.D.', 'Diploma',
]

const SPECIALIZATIONS = [
  'Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science',
  'Physical Education', 'Art & Design', 'Music', 'Languages', 'Business Studies', 'Economics',
]

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract']
const DEPARTMENTS = ['Science', 'Mathematics', 'English', 'Social Studies', 'Computer', 'Physical Education', 'Arts', 'Primary']
const GENDERS = ['Male', 'Female', 'Other']
const STATUS_OPTIONS = ['Active', 'On Leave', 'Inactive']

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
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ id: '', password: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)
  const [selectedSchool, setSelectedSchool] = useState<{ id: string, name: string, code: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    gender: '',
    employmentType: ''
  })
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    employeeId: true,
    name: true,
    email: true,
    qualification: true,
    department: true,
    phone: false,
    subject: false,
    status: true,
    actions: true,
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

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

    // Check for selected school in localStorage
    const schoolData = localStorage.getItem('selected_school')
    if (schoolData) {
      try {
        setSelectedSchool(JSON.parse(schoolData))
      } catch (e) {
        console.error('Failed to parse selected school', e)
      }
    }
  }, [isSuperAdmin])

  const generateTeacherId = () => {
    const currentYear = new Date().getFullYear()
    const prefix = `TCH-${currentYear}`

    const maxSequence = teachers.reduce((max, t) => {
      const id = t.employee_id || t.teacherId || ''
      if (id && id.startsWith(prefix)) {
        const parts = id.split('-')
        if (parts.length === 3) {
          const seq = parseInt(parts[2], 10)
          return !isNaN(seq) && seq > max ? seq : max
        }
      }
      return max
    }, 0)

    return `${prefix}-${String(maxSequence + 1).padStart(3, '0')}`
  }

  const handleAddTeacher = () => {
    setEditingId(null)
    setFormData({
      ...DEFAULT_FORM_STATE,
      employeeId: generateTeacherId(),
      password: '',
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
      joiningDate: (teacher.join_date || teacher.joiningDate || '').split('T')[0],
      employmentType: teacher.employmentType || teacher.employment_type || 'Full-time',
      salary: teacher.salary || 0,
      status: teacher.status || 'Active',
      classAssigned: teacher.classAssigned || teacher.class_assigned || '',
      subject: teacher.subject || '',
      address: teacher.address || '',
      city: teacher.city || '',
      state: teacher.state || '',
      department: teacher.department || '',
      employeeId: teacher.employee_id || teacher.teacherId || '',
      password: '',
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
      toast.error('Please enter first and last name')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Please enter email address')
      return false
    }
    if (!formData.qualification) {
      toast.error('Please select qualification')
      return false
    }
    if (!formData.employeeId) {
      toast.error('Employee ID is required')
      return false
    }
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.qualification || !formData.joiningDate || !formData.employeeId) {
      toast.error('Please fill in all required fields')
      return false
    }

    // Password validation for new teachers
    if (!editingId && formData.password) {
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters long')
        return false
      }
      if (!/[A-Z]/.test(formData.password)) {
        toast.error('Password must contain at least one uppercase letter')
        return false
      }
      if (!/[a-z]/.test(formData.password)) {
        toast.error('Password must contain at least one lowercase letter')
        return false
      }
      if (!/[0-9]/.test(formData.password)) {
        toast.error('Password must contain at least one number')
        return false
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        toast.error('Password must contain at least one special character')
        return false
      }
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
        school_id: formData.schoolId || '1',
        qualification: formData.qualification,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        specialization: formData.specialization,
        experience: formData.experience,
        employment_type: formData.employmentType,
        salary: formData.salary,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        subject: formData.subject,
        class_assigned: formData.classAssigned,
        department: formData.department,
        employee_id: formData.employeeId,
      }

      // Use School Code from local storage
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        const selectedSchool = JSON.parse(selectedSchoolStr)
        if (selectedSchool.code === 'system') {
          toast.error('You must select a specific school from the Schools list before creating a teacher.')
          setLoading(false)
          return
        }
        payload.school_id = selectedSchool.id.toString()
      } else if (!isSuperAdmin) {
        toast.error('Active school not found. Please re-select school.')
        return
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
      toast.success(editingId ? 'Teacher details updated successfully' : 'Teacher created successfully')
    } catch (error) {
      console.error('Failed to save teacher:', error)
      toast.error((error as any).message || 'Failed to save teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setSelectedTeacherId(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedTeacherId) return
    setIsDeleting(true)
    try {
      await teacherAPI.delete(selectedTeacherId)
      await fetchTeachers()
      toast.success('Teacher deleted successfully')
    } catch (error) {
      console.error('Failed to delete teacher:', error)
      toast.error('Failed to delete teacher')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setSelectedTeacherId(null)
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

  const handleChangePasswordClick = (teacherId: string) => {
    setPasswordForm({ id: teacherId, password: '' })
    setShowPasswordModal(true)
    setActiveDropdownId(null)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would call the API to update the password here
    toast.success(`Password updated for teacher ID: ${passwordForm.id}`)
    setShowPasswordModal(false)
  }

  // Filter Logic
  const filteredTeachers = teachers.filter(teacher => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      (teacher.firstName || '').toLowerCase().includes(query) ||
      (teacher.lastName || '').toLowerCase().includes(query) ||
      (teacher.email || '').toLowerCase().includes(query) ||
      (teacher.employee_id || teacher.teacherId || '').toLowerCase().includes(query) ||
      (teacher.phone || '').includes(query)

    const matchesDept = filters.department ? teacher.department === filters.department : true
    const matchesStatus = filters.status ? (teacher.status === filters.status || teacher.status?.toLowerCase() === filters.status.toLowerCase()) : true
    const matchesGender = filters.gender ? teacher.gender === filters.gender : true
    const matchesType = filters.employmentType ? (teacher.employmentType === filters.employmentType || teacher.employment_type === filters.employmentType) : true

    return matchesSearch && matchesDept && matchesStatus && matchesGender && matchesType
  })

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({ department: '', status: '', gender: '', employmentType: '' })
  }

  const activeFiltersCount = [filters.department, filters.status, filters.gender, filters.employmentType].filter(Boolean).length;

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status?.toLowerCase() === 'active').length;
  const inactiveTeachers = totalTeachers - activeTeachers;

  if (isSuperAdmin && (!selectedSchool || selectedSchool.code === 'system')) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        <Navbar showBackButton={true} backLink="/dashboard" />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-medium">
                    Super Admin Context Required
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Please select a school from the <Link href="/dashboard/schools" className="font-bold underline">Schools list</Link> to manage teachers.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6 pb-64 overflow-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Teachers Management
            </h1>
            <p className="text-gray-600">Manage teacher profiles and assignments</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{totalTeachers}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="p-3 bg-green-50 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Profiles</p>
                <p className="text-2xl font-bold text-gray-900">{activeTeachers}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="p-3 bg-orange-50 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Inactive Profiles</p>
                <p className="text-2xl font-bold text-gray-900">{inactiveTeachers}</p>
              </div>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="max-w-2xl w-full relative group">
              {/* Search Bar Container */}
              <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 overflow-hidden">
                <div className="pl-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Active Filter Chips */}
                <div className="flex flex-wrap gap-2 px-2 max-w-[50%]">
                  {Object.entries(filters).map(([key, value]) => value && (
                    <span key={key} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold border border-blue-100">
                      <span className="opacity-60 capitalize">{key}:</span> {value}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search by Name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 focus:outline-none text-sm bg-transparent"
                />

                {/* Dropdown Trigger */}
                <button
                  onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                  className={`p-2 border-l border-gray-100 transition-colors hover:bg-gray-50 ${showSearchDropdown ? 'bg-gray-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showSearchDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Dropdown Menu */}
              {showSearchDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)}></div>
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 grid grid-cols-1 md:grid-cols-3 p-6 animate-fade-in-up">
                    {/* Filters Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Department</label>
                          <div className="grid grid-cols-2 gap-2">
                            {DEPARTMENTS.slice(0, 4).map(dept => (
                              <button
                                key={dept}
                                onClick={() => setFilters(prev => ({ ...prev, department: prev.department === dept ? '' : dept }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.department === dept ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} border`}
                              >
                                {dept}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Active', 'Inactive', 'On Leave'].map(st => (
                              <button
                                key={st}
                                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === st ? '' : st }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.status === st ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} border`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Group By Section */}
                    <div className="border-l border-gray-100 pl-6 space-y-4">
                      <div className="flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-wider mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Group By
                      </div>
                      <div className="space-y-2">
                        {['Department', 'Status', 'Employment Type'].map(group => (
                          <button
                            key={group}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-all border border-transparent hover:border-purple-100"
                          >
                            {group}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Favorites Section */}
                    <div className="border-l border-gray-100 pl-6 space-y-4">
                      <div className="flex items-center gap-2 text-yellow-600 font-bold text-sm uppercase tracking-wider mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Favorites
                      </div>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 border-2 border-dashed border-gray-100 hover:border-yellow-200 hover:text-yellow-600 hover:bg-yellow-50 transition-all flex items-center gap-2">
                        <span className="text-lg">+</span> Save current search
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleAddTeacher}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <span className="text-xl">+</span>
                Add Teacher
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-visible border border-gray-100">
            <table className="w-full">
              <thead className="relative z-20">
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  {visibleColumns.employeeId && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Employee ID</th>}
                  {visibleColumns.name && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Name</th>}
                  {visibleColumns.qualification && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Qualification</th>}
                  {visibleColumns.department && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Department</th>}
                  {visibleColumns.phone && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Phone</th>}
                  {visibleColumns.subject && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Subject</th>}
                  {visibleColumns.status && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Status</th>}
                  <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider relative">
                    <div className="flex items-center justify-between gap-2">
                      <span>Actions</span>
                      <div className="relative">
                        <button
                          onClick={() => setShowColumnPicker(!showColumnPicker)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 group active:scale-95"
                          title="Column Visibility"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {showColumnPicker && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 py-3 animate-fade-in-up">
                              <div className="px-4 py-2 border-b border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900">Show/Hide Columns</h4>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto py-2">
                                {Object.entries(visibleColumns).map(([key, isVisible]) => (
                                  <label
                                    key={key}
                                    className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer group transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isVisible}
                                      onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition-all cursor-pointer"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700 capitalize group-hover:text-blue-600 transition-colors">
                                      {key.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p>Loading teachers...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-medium">No teachers match your search</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting keywords or filters</p>
                        <button onClick={clearFilters} className="mt-4 text-blue-600 font-semibold hover:underline">
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className={`hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 ${activeDropdownId === teacher.id ? 'relative z-30' : ''}`}>
                      {visibleColumns.employeeId && (
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium text-sm">
                            {teacher.employee_id || teacher.teacherId}
                          </span>
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {teacher.firstName} {teacher.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{teacher.email}</div>
                        </td>
                      )}
                      {visibleColumns.qualification && <td className="px-6 py-4 text-gray-600">{teacher.qualification}</td>}
                      {visibleColumns.department && <td className="px-6 py-4 text-gray-600">{teacher.department || '-'}</td>}
                      {visibleColumns.phone && <td className="px-6 py-4 text-gray-600 text-sm">{teacher.phone || 'N/A'}</td>}
                      {visibleColumns.subject && <td className="px-6 py-4 text-gray-600 text-sm">{teacher.subject || '-'}</td>}
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        <FormattedDate date={teacher.join_date || teacher.joiningDate} />
                      </td>
                      {visibleColumns.status && (
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${teacher.status?.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-700'
                              : teacher.status?.toLowerCase() === 'on leave'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                              }`}
                          >
                            {teacher.status?.charAt(0).toUpperCase() + teacher.status?.slice(1)}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === teacher.id ? null : teacher.id)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          {activeDropdownId === teacher.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-100 animate-fade-in-up">
                              <div className="py-1">
                                <button
                                  onClick={() => { handleEditTeacher(teacher); setActiveDropdownId(null) }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <span>✏️</span> Edit Details
                                </button>
                                <button
                                  onClick={() => handleChangePasswordClick(teacher.id)}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <span>🔑</span> Change Password
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    router.push({
                                      pathname: '/auth/login',
                                      query: { email: teacher.email }
                                    })
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <span>👤</span> Login as Teacher
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => handleDeleteClick(teacher.id)}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <span>🗑️</span> Delete Teacher
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {activeDropdownId === teacher.id && (
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveDropdownId(null)}
                          ></div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </main>
      </div>

      {/* Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6 border-b-2 border-blue-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingId ? 'Edit Teacher Details' : 'Add New Teacher'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Complete the teacher profile in sections below</p>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-10 flex border-b-2 border-blue-200 bg-gradient-to-r from-gray-50 to-blue-50 shadow-md">
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-4 text-sm font-bold transition-all duration-200 relative ${activeTab === 'personal'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}>
                Personal Info
                {activeTab === 'personal' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('professional')}
                className={`flex-1 py-4 text-sm font-bold transition-all duration-200 relative ${activeTab === 'professional'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}>
                Professional
                {activeTab === 'professional' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('academic')}
                className={`flex-1 py-4 text-sm font-bold transition-all duration-200 relative ${activeTab === 'academic'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}>
                Academic & Assigned
                {activeTab === 'academic' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID *</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="employeeId"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 font-mono font-bold text-blue-600"
                          placeholder="e.g. TCH-2024-001"
                        />
                        {!editingId && (
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, employeeId: generateTeacherId() }))}
                            className="absolute right-3 top-3 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Regenerate ID"
                          >
                            🔄
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Official Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all"
                        placeholder="teacher@school.edu"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                      >
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                      <NepaliDatePicker
                        value={formData.dateOfBirth}
                        onChange={(date) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                      placeholder="+977-XXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                      placeholder="Full Residential Address"
                    />
                  </div>
                </div>
              )}

              {/* Professional Details Tab */}
              {activeTab === 'professional' && (
                <div className="space-y-6">

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Qualification *</label>
                      <select
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50">
                        <option value="">Select Qualification</option>
                        {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50">
                        <option value="">Select Specialization</option>
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date *</label>
                      <NepaliDatePicker
                        value={formData.joiningDate}
                        onChange={(date) => setFormData(prev => ({ ...prev, joiningDate: date }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Experience (Years)</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        step="0.5"
                        min="0"
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Tab */}
              {activeTab === 'academic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                        placeholder="e.g. Science"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {!editingId && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                          placeholder="••••••••"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-5 border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all">
                Cancel
              </button>
              <button
                onClick={handleSaveTeacher}
                disabled={loading}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all">
                {loading ? 'Saving...' : (editingId ? 'Update Profile' : 'Save Teacher')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b-2 border-blue-200">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-8 py-6 border-b-2 border-red-100">
              <h3 className="text-2xl font-bold text-red-600 flex items-center gap-3">
                <span className="p-2 bg-red-100 rounded-lg text-xl">⚠️</span>
                Delete Teacher
              </h3>
            </div>
            <div className="p-8">
              <p className="text-gray-600 text-lg leading-relaxed">
                Are you sure you want to delete this teacher? This action <span className="text-red-600 font-bold underline">cannot be undone</span> and all related data will be permanently removed.
              </p>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-white border-2 border-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center gap-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-8 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-200 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
