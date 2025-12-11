import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import NepaliDatePicker from '@/components/NepaliDatePicker'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  joinDate: string
  accessLevel: 'Admin' | 'Staff' | 'Teacher' | 'Support'
  status: 'Active' | 'On Leave' | 'Inactive'
  address: string
  city: string
  state: string
  zipCode: string
  qualification: string
  experience: number
  salary?: number
  notes?: string
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  joinDate: string
  accessLevel: 'Admin' | 'Staff' | 'Teacher' | 'Support'
  status: 'Active' | 'On Leave' | 'Inactive'
  address: string
  city: string
  state: string
  zipCode: string
  qualification: string
  experience: number
  salary?: number
  notes?: string
}

interface Department {
  id: string
  name: string
  description?: string
  headOfDepartment?: string
  createdAt: string
}

interface DepartmentFormData {
  name: string
  description: string
  headOfDepartment: string
}

const POSITIONS = [
  'Principal',
  'Vice Principal',
  'Teacher',
  'Assistant Teacher',
  'Counselor',
  'Librarian',
  'Administrative Staff',
  'Support Staff',
  'Driver',
  'Security',
]

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Academic', description: 'Academic and teaching staff', createdAt: new Date().toISOString() },
  { id: '2', name: 'Administration', description: 'Administrative staff', createdAt: new Date().toISOString() },
  { id: '3', name: 'Finance', description: 'Finance and accounting', createdAt: new Date().toISOString() },
  { id: '4', name: 'IT', description: 'Information Technology', createdAt: new Date().toISOString() },
  { id: '5', name: 'Support Services', description: 'Support and maintenance', createdAt: new Date().toISOString() },
  { id: '6', name: 'Counseling', description: 'Student counseling services', createdAt: new Date().toISOString() },
  { id: '7', name: 'Sports', description: 'Sports and physical education', createdAt: new Date().toISOString() },
]

const QUALIFICATIONS = [
  'B.A.',
  'B.Sc.',
  'B.Com.',
  'B.Tech',
  'M.A.',
  'M.Sc.',
  'M.Com.',
  'M.Tech',
  'M.Ed.',
  'Ph.D.',
]

const ACCESS_LEVELS = ['Admin', 'Staff', 'Teacher', 'Support'] as const

const DEFAULT_FORM_STATE: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: 'Teacher',
  department: 'Academic',
  joinDate: '',
  accessLevel: 'Staff',
  status: 'Active',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  qualification: 'B.A.',
  experience: 0,
  salary: 0,
  notes: '',
}

export default function StaffPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [currentView, setCurrentView] = useState<'staff' | 'departments'>('staff') // Track which view to show
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)
  const [departmentFormData, setDepartmentFormData] = useState<DepartmentFormData>({ name: '', description: '', headOfDepartment: '' })
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'contact'>('personal')
  const [searchQuery, setSearchQuery] = useState('')

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
      // Load staff
      const savedStaff = localStorage.getItem('staff')
      if (savedStaff) {
        try {
          setStaffMembers(JSON.parse(savedStaff))
        } catch (error) {
          console.error('Failed to load staff:', error)
          const defaultStaff: StaffMember[] = [
            {
              id: '1',
              firstName: 'Rajesh',
              lastName: 'Kumar',
              email: 'rajesh.kumar@school.edu',
              phone: '+91-98765-43210',
              position: 'Principal',
              department: 'Administration',
              joinDate: '2015-06-01',
              accessLevel: 'Admin',
              status: 'Active',
              address: '123 School Lane',
              city: 'Kathmandu',
              state: 'Bagmati',
              zipCode: '44600',
              qualification: 'M.Ed.',
              experience: 15,
              salary: 75000,
              notes: 'Senior Administrator',
            },
            {
              id: '2',
              firstName: 'Priya',
              lastName: 'Singh',
              email: 'priya.singh@school.edu',
              phone: '+91-98765-43211',
              position: 'Teacher',
              department: 'Academic',
              joinDate: '2018-08-15',
              accessLevel: 'Teacher',
              status: 'Active',
              address: '456 School Lane',
              city: 'Kathmandu',
              state: 'Bagmati',
              zipCode: '44600',
              qualification: 'M.A.',
              experience: 6,
              salary: 45000,
              notes: 'Mathematics Teacher',
            },
            {
              id: '3',
              firstName: 'Amit',
              lastName: 'Patel',
              email: 'amit.patel@school.edu',
              phone: '+91-98765-43212',
              position: 'Support Staff',
              department: 'Support Services',
              joinDate: '2020-01-10',
              accessLevel: 'Support',
              status: 'Active',
              address: '789 School Lane',
              city: 'Kathmandu',
              state: 'Bagmati',
              zipCode: '44600',
              qualification: 'B.A.',
              experience: 2,
              salary: 25000,
              notes: 'Maintenance Staff',
            },
          ]
          setStaffMembers(defaultStaff)
        }
      } else {
        const defaultStaff: StaffMember[] = [
          {
            id: '1',
            firstName: 'Rajesh',
            lastName: 'Kumar',
            email: 'rajesh.kumar@school.edu',
            phone: '+91-98765-43210',
            position: 'Principal',
            department: 'Administration',
            joinDate: '2015-06-01',
            accessLevel: 'Admin',
            status: 'Active',
            address: '123 School Lane',
            city: 'Kathmandu',
            state: 'Bagmati',
            zipCode: '44600',
            qualification: 'M.Ed.',
            experience: 15,
            salary: 75000,
            notes: 'Senior Administrator',
          },
          {
            id: '2',
            firstName: 'Priya',
            lastName: 'Singh',
            email: 'priya.singh@school.edu',
            phone: '+91-98765-43211',
            position: 'Teacher',
            department: 'Academic',
            joinDate: '2018-08-15',
            accessLevel: 'Teacher',
            status: 'Active',
            address: '456 School Lane',
            city: 'Kathmandu',
            state: 'Bagmati',
            zipCode: '44600',
            qualification: 'M.A.',
            experience: 6,
            salary: 45000,
            notes: 'Mathematics Teacher',
          },
          {
            id: '3',
            firstName: 'Amit',
            lastName: 'Patel',
            email: 'amit.patel@school.edu',
            phone: '+91-98765-43212',
            position: 'Support Staff',
            department: 'Support Services',
            joinDate: '2020-01-10',
            accessLevel: 'Support',
            status: 'Active',
            address: '789 School Lane',
            city: 'Kathmandu',
            state: 'Bagmati',
            zipCode: '44600',
            qualification: 'B.A.',
            experience: 2,
            salary: 25000,
            notes: 'Maintenance Staff',
          },
        ]
        setStaffMembers(defaultStaff)
      }

      // Load departments
      const savedDepartments = localStorage.getItem('departments')
      if (savedDepartments) {
        try {
          setDepartments(JSON.parse(savedDepartments))
        } catch (error) {
          console.error('Failed to load departments:', error)
          setDepartments(DEFAULT_DEPARTMENTS)
        }
      } else {
        setDepartments(DEFAULT_DEPARTMENTS)
      }

      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('staff', JSON.stringify(staffMembers))
      localStorage.setItem('departments', JSON.stringify(departments))
    }
  }, [staffMembers, departments, isHydrated])

  // Handle hash navigation for view switching
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash

        if (hash === '#departments') {
          setCurrentView('departments')
          // Clear the hash after changing view
          window.history.replaceState(null, '', window.location.pathname)
        } else if (hash === '#staff-view') {
          setCurrentView('staff')
          // Clear the hash after changing view
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
    }

    // Check on mount and route change
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [router.asPath]) // Re-run when route changes

  const handleAddStaff = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setActiveTab('personal')
    setShowModal(true)
  }

  const handleEditStaff = (staff: StaffMember) => {
    setEditingId(staff.id)
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      position: staff.position,
      department: staff.department,
      joinDate: staff.joinDate,
      accessLevel: staff.accessLevel,
      status: staff.status,
      address: staff.address,
      city: staff.city,
      state: staff.state,
      zipCode: staff.zipCode,
      qualification: staff.qualification,
      experience: staff.experience,
      salary: staff.salary,
      notes: staff.notes,
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
      [name]: name === 'experience' || name === 'salary' ? (parseInt(value) || 0) : value,
    }))
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      alert('Please enter first name')
      return false
    }
    if (!formData.lastName.trim()) {
      alert('Please enter last name')
      return false
    }
    if (!formData.email.trim()) {
      alert('Please enter email')
      return false
    }
    if (!formData.phone.trim()) {
      alert('Please enter phone number')
      return false
    }
    if (!formData.joinDate) {
      alert('Please select join date')
      return false
    }
    return true
  }

  const handleSaveStaff = () => {
    if (!validateForm()) return

    if (editingId) {
      // Update existing staff
      setStaffMembers((prev) =>
        prev.map((staff) =>
          staff.id === editingId
            ? {
              ...staff,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              position: formData.position,
              department: formData.department,
              joinDate: formData.joinDate,
              accessLevel: formData.accessLevel,
              status: formData.status,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              qualification: formData.qualification,
              experience: formData.experience,
              salary: formData.salary,
              notes: formData.notes,
            }
            : staff
        )
      )
    } else {
      // Add new staff
      const newStaff: StaffMember = {
        id: Date.now().toString(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        joinDate: formData.joinDate,
        accessLevel: formData.accessLevel,
        status: formData.status,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        qualification: formData.qualification,
        experience: formData.experience,
        salary: formData.salary,
        notes: formData.notes,
      }
      setStaffMembers((prev) => [newStaff, ...prev])
    }

    handleCloseModal()
  }

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      setStaffMembers((prev) => prev.filter((staff) => staff.id !== id))
    }
  }

  // Department Management Functions
  const handleManageDepartments = () => {
    setShowDepartmentModal(true)
  }

  const handleCloseDepartmentModal = () => {
    setShowDepartmentModal(false)
    setEditingDepartmentId(null)
    setDepartmentFormData({ name: '', description: '', headOfDepartment: '' })
  }

  const handleAddDepartment = () => {
    setEditingDepartmentId(null)
    setDepartmentFormData({ name: '', description: '', headOfDepartment: '' })
  }

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartmentId(dept.id)
    setDepartmentFormData({
      name: dept.name,
      description: dept.description || '',
      headOfDepartment: dept.headOfDepartment || '',
    })
  }

  const handleSaveDepartment = () => {
    if (!departmentFormData.name.trim()) {
      alert('Please enter department name')
      return
    }

    if (editingDepartmentId) {
      // Update existing department
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === editingDepartmentId
            ? {
              ...dept,
              name: departmentFormData.name,
              description: departmentFormData.description,
              headOfDepartment: departmentFormData.headOfDepartment,
            }
            : dept
        )
      )
    } else {
      // Add new department
      const newDepartment: Department = {
        id: Date.now().toString(),
        name: departmentFormData.name,
        description: departmentFormData.description,
        headOfDepartment: departmentFormData.headOfDepartment,
        createdAt: new Date().toISOString(),
      }
      setDepartments((prev) => [...prev, newDepartment])
    }

    setEditingDepartmentId(null)
    setDepartmentFormData({ name: '', description: '', headOfDepartment: '' })
  }

  const handleDeleteDepartment = (id: string) => {
    const departmentToDelete = departments.find((d) => d.id === id)
    if (!departmentToDelete) return

    // Check if any staff members are assigned to this department
    const staffInDepartment = staffMembers.filter((s) => s.department === departmentToDelete.name)
    if (staffInDepartment.length > 0) {
      alert(`Cannot delete department "${departmentToDelete.name}" because ${staffInDepartment.length} staff member(s) are assigned to it.`)
      return
    }

    if (confirm(`Are you sure you want to delete the department "${departmentToDelete.name}"?`)) {
      setDepartments((prev) => prev.filter((dept) => dept.id !== id))
    }
  }

  const handleDepartmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDepartmentFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'Admin':
        return 'bg-red-100 text-red-800'
      case 'Staff':
        return 'bg-blue-100 text-blue-800'
      case 'Teacher':
        return 'bg-green-100 text-green-800'
      case 'Support':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'On Leave':
        return 'bg-orange-100 text-orange-800'
      case 'Inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-4">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentView === 'staff' ? 'Staff Management' : 'Department Management'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentView === 'staff' ? 'Manage your school staff members' : 'Manage school departments'}
            </p>
          </div>

          {/* Conditional Content Based on View */}
          {currentView === 'staff' ? (
            <>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search staff by name, position, department, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                    🔍
                  </span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Add Staff Button */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAddStaff}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="text-xl">+</span>
                  Add New Staff
                </button>
              </div>

              {staffMembers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No staff members added yet. Click "Add New Staff" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // Filter staff members based on search query
                    const filteredStaff = staffMembers.filter((staff) => {
                      const query = searchQuery.toLowerCase()
                      return (
                        staff.firstName.toLowerCase().includes(query) ||
                        staff.lastName.toLowerCase().includes(query) ||
                        staff.position.toLowerCase().includes(query) ||
                        staff.department.toLowerCase().includes(query) ||
                        staff.email.toLowerCase().includes(query) ||
                        `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(query)
                      )
                    })

                    // Show message if no results found
                    if (filteredStaff.length === 0) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
                          <p className="text-gray-500 dark:text-gray-400 text-lg">
                            No staff members found matching "{searchQuery}"
                          </p>
                          <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Clear Search
                          </button>
                        </div>
                      )
                    }

                    return filteredStaff.map((staff) => (
                      <div key={staff.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {staff.firstName} {staff.lastName}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAccessLevelColor(staff.accessLevel)} dark:${getAccessLevelColor(staff.accessLevel).replace('bg-', 'dark:bg-').replace('text-', 'dark:text-')}`}>
                                {staff.accessLevel}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(staff.status)} dark:${getStatusColor(staff.status).replace('bg-', 'dark:bg-').replace('text-', 'dark:text-')}`}>
                                {staff.status}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">
                              <span className="font-semibold">Position:</span> {staff.position} | <span className="font-semibold">Department:</span> {staff.department}
                            </p>
                            <div className="grid grid-cols-4 gap-4 mt-3">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{staff.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{staff.phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Experience</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{staff.experience} years</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                                <p className="font-semibold text-gray-900 dark:text-white">📅 {staff.joinDate}</p>
                              </div>
                            </div>
                            {staff.notes && <p className="text-gray-600 dark:text-gray-300 mt-3 italic">📝 {staff.notes}</p>}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditStaff(staff)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}

              {/* Statistics */}
              {staffMembers.length > 0 && (
                <div className="grid grid-cols-5 gap-4 mt-8">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Staff</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{staffMembers.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {staffMembers.filter((s) => s.status === 'Active').length}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">On Leave</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {staffMembers.filter((s) => s.status === 'On Leave').length}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Admins</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {staffMembers.filter((s) => s.accessLevel === 'Admin').length}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Teachers</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {staffMembers.filter((s) => s.position === 'Teacher' || s.position === 'Assistant Teacher').length}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Department Management View */
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Departments</h2>
                <button
                  onClick={() => {
                    setEditingDepartmentId(null)
                    setDepartmentFormData({ name: '', description: '', headOfDepartment: '' })
                    setShowDepartmentModal(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Department
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditDepartment(dept)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{dept.description}</p>
                    {dept.headOfDepartment && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Head:</span> {staffMembers.find((s) => s.id === dept.headOfDepartment)?.firstName} {staffMembers.find((s) => s.id === dept.headOfDepartment)?.lastName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'personal'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                >
                  Personal Info
                </button>
                <button
                  onClick={() => setActiveTab('professional')}
                  className={`py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'professional'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                >
                  Professional Details
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'contact'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                >
                  Contact & Address
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Professional Details Tab */}
              {activeTab === 'professional' && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position *</label>
                      <select
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qualification</label>
                      <select
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {QUALIFICATIONS.map((qual) => (
                          <option key={qual} value={qual}>
                            {qual}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <NepaliDatePicker
                        label="Join Date"
                        value={formData.joinDate}
                        onChange={(date: string) => setFormData(prev => ({ ...prev, joinDate: date }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Level</label>
                      <select
                        name="accessLevel"
                        value={formData.accessLevel}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {ACCESS_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Salary (₹)</label>
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Contact & Address Tab */}
              {activeTab === 'contact' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State/Province</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-blue-100 mb-3">Preview</h4>
                    <div className="bg-white dark:bg-gray-700 p-4 rounded border border-blue-200 dark:border-blue-700 space-y-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formData.firstName || 'First'} {formData.lastName || 'Last'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{formData.address || 'Address'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formData.city || 'City'}, {formData.state || 'State'} {formData.zipCode || 'ZIP'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">📧 {formData.email || 'email@example.com'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">📱 {formData.phone || '+91-0000-00000'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaff}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition-colors font-semibold shadow-md"
              >
                {editingId ? 'Update Staff' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Management Modal */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Departments</h3>
              <button
                onClick={handleCloseDepartmentModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Add/Edit Department Form */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingDepartmentId ? 'Edit Department' : 'Add New Department'}
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={departmentFormData.name}
                      onChange={handleDepartmentInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Human Resources"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={departmentFormData.description}
                      onChange={handleDepartmentInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Brief description of the department"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Head of Department
                    </label>
                    <input
                      type="text"
                      name="headOfDepartment"
                      value={departmentFormData.headOfDepartment}
                      onChange={handleDepartmentInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Name of department head"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveDepartment}
                      className="px-6 py-2 bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg transition-colors font-semibold shadow-md"
                    >
                      {editingDepartmentId ? 'Update Department' : 'Add Department'}
                    </button>
                    {editingDepartmentId && (
                      <button
                        onClick={handleAddDepartment}
                        className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Departments List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  All Departments ({departments.length})
                </h4>
                {departments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No departments added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {dept.name}
                            </h5>
                            {dept.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {dept.description}
                              </p>
                            )}
                            {dept.headOfDepartment && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="font-medium">Head:</span> {dept.headOfDepartment}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              Staff Count: {staffMembers.filter((s) => s.department === dept.name).length}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditDepartment(dept)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-semibold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(dept.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-end">
              <button
                onClick={handleCloseDepartmentModal}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
