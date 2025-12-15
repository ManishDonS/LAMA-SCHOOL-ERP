import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import NepaliDatePicker from '@/components/NepaliDatePicker'

interface Student {
  id: number
  // Basic Profile
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationality: string
  studentId: string
  enrollmentDate: string
  currentClass: string
  section: string
  rollNumber: string
  // Parent/Guardian
  fatherName: string
  motherName: string
  guardianName: string
  guardianRelation: string
  primaryPhone: string
  secondaryPhone: string
  email: string
  homeAddress: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  // Academic
  previousSchool: string
  subjects: string
  feeCategory: string
  house: string
  // Health & Safety
  medicalConditions: string
  allergies: string
  medications: string
  specialNeeds: string
  bloodGroup: string
  // Attendance & ID
  rfidNumber: string
  busRoute: string
  uniformSize: string
  // Transport
  pickupAddress: string
  dropoffAddress: string
  driverInfo: string
  // Documents & Admin
  status: string
  username: string
  notes: string
  password?: string
}

const DEFAULT_STUDENTS = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '2008-05-15',
    gender: 'Male',
    nationality: 'Indian',
    studentId: 'STU-2024-0001',
    enrollmentDate: '2020-06-01',
    currentClass: '10A',
    section: 'A',
    rollNumber: '1',
    fatherName: 'Robert Doe',
    motherName: 'Mary Doe',
    guardianName: '',
    guardianRelation: '',
    primaryPhone: '+1234567890',
    secondaryPhone: '',
    email: 'john@school.com',
    homeAddress: '123 Main St',
    emergencyContactName: 'Mary Doe',
    emergencyContactPhone: '+1234567890',
    emergencyContactRelation: 'Mother',
    previousSchool: 'Primary School',
    subjects: 'English, Math, Science',
    feeCategory: 'Regular',
    house: 'Red',
    medicalConditions: 'None',
    allergies: 'None',
    medications: 'None',
    specialNeeds: 'None',
    bloodGroup: 'O+',
    rfidNumber: 'RF001',
    busRoute: 'Route A',
    uniformSize: 'Large',
    pickupAddress: '123 Main St',
    dropoffAddress: '123 Main St',
    driverInfo: 'Driver Name',
    status: 'Active',
    username: 'john.doe',
    notes: 'Good student',
  },
]

const TABS = [
  { id: 'basic', label: 'Basic Profile' },
  { id: 'guardian', label: 'Guardian Details' },
  { id: 'academic', label: 'Academic' },
  { id: 'health', label: 'Health & Safety' },
  { id: 'attendance', label: 'ID & Transport' },
]

const GUARDIAN_RELATIONS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Uncle',
  'Aunt',
  'Cousin',
  'Stepfather',
  'Stepmother',
  'Stepbrother',
  'Stepsister',
  'Guardian',
  'Legal Guardian',
  'Tutor',
  'Other (specify)',
]

const NATIONALITIES = [
  'Afghan',
  'Albanian',
  'Algerian',
  'American',
  'Andorran',
  'Angolan',
  'Argentinian',
  'Armenian',
  'Australian',
  'Austrian',
  'Azerbaijani',
  'Bahamian',
  'Bahraini',
  'Bangladeshi',
  'Barbadian',
  'Belarusian',
  'Belgian',
  'Belizean',
  'Beninese',
  'Bhutanese',
  'Bolivian',
  'Bosnian',
  'Botswanan',
  'Brazilian',
  'British',
  'Bruneian',
  'Bulgarian',
  'Burkinabe',
  'Burmese',
  'Burundian',
  'Cambodian',
  'Cameroonian',
  'Canadian',
  'Cape Verdean',
  'Central African',
  'Chadian',
  'Chilean',
  'Chinese',
  'Colombian',
  'Comoran',
  'Congolese',
  'Costa Rican',
  'Croat',
  'Cuban',
  'Cypriot',
  'Czech',
  'Danish',
  'Djibouti',
  'Dominican',
  'Dutch',
  'East Timorese',
  'Ecuadorian',
  'Egyptian',
  'Emirati',
  'Equatorial Guinean',
  'Eritrean',
  'Estonian',
  'Ethiopian',
  'Fijian',
  'Filipino',
  'Finnish',
  'French',
  'Gabonese',
  'Gambian',
  'Georgian',
  'German',
  'Ghanaian',
  'Greek',
  'Greenlandic',
  'Grenadian',
  'Guatemalan',
  'Guinean',
  'Guinea-Bissauan',
  'Guyanese',
  'Haitian',
  'Honduran',
  'Hungarian',
  'Icelandic',
  'Indian',
  'Indonesian',
  'Iranian',
  'Iraqi',
  'Irish',
  'Israeli',
  'Italian',
  'Ivorian',
  'Jamaican',
  'Japanese',
  'Jordanian',
  'Kazakhstani',
  'Kenyan',
  'Kittitian',
  'Kuwaiti',
  'Kyrgyz',
  'Lao',
  'Latvian',
  'Lebanese',
  'Lesothan',
  'Liberian',
  'Libyan',
  'Liechtensteiner',
  'Lithuanian',
  'Luxembourger',
  'Macedonian',
  'Malagasy',
  'Malawian',
  'Malaysian',
  'Maldivian',
  'Malian',
  'Maltese',
  'Manx',
  'Marshallese',
  'Martinican',
  'Mauritanian',
  'Mauritian',
  'Mexican',
  'Micronesian',
  'Moldovan',
  'Monacan',
  'Mongolian',
  'Montenegrin',
  'Moroccan',
  'Mozambican',
  'Namibian',
  'Nauruan',
  'Nepalese',
  'Netherlands',
  'Nicaraguan',
  'Nigerian',
  'Nigerien',
  'North Korean',
  'Northern Irish',
  'Norwegian',
  'Omani',
  'Pakistani',
  'Palauan',
  'Palestinian',
  'Panamanian',
  'Papua New Guinean',
  'Paraguayan',
  'Peruvian',
  'Polish',
  'Portuguese',
  'Puerto Rican',
  'Qatari',
  'Réunionese',
  'Romanian',
  'Russian',
  'Rwandan',
  'Saint Barthélemy',
  'Saint Lucian',
  'Salvadoran',
  'Sammarinese',
  'Samoan',
  'São Toméan',
  'Saudi Arabian',
  'Scottish',
  'Senegalese',
  'Serbian',
  'Seychellois',
  'Sierra Leonean',
  'Singaporean',
  'Slovak',
  'Slovenian',
  'Solomon Islander',
  'Somalian',
  'South African',
  'South Korean',
  'South Sudanese',
  'Spanish',
  'Sri Lankan',
  'Sudanese',
  'Surinamese',
  'Swedish',
  'Swiss',
  'Syrian',
  'Taiwanese',
  'Tajik',
  'Tanzanian',
  'Thai',
  'Togolese',
  'Tongan',
  'Trinidadian',
  'Tunisian',
  'Turkish',
  'Turkmen',
  'Tuvaluan',
  'Ugandan',
  'Ukrainian',
  'Uruguayan',
  'Uzbek',
  'Vanuatuan',
  'Vatican',
  'Venezuelan',
  'Vietnamese',
  'Virgin Islander',
  'Welsh',
  'Yemeni',
  'Zambian',
  'Zimbabwean',
]

export default function StudentsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [customGuardianRelation, setCustomGuardianRelation] = useState('')
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ id: 0, password: '' })

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    status: '',
    gender: ''
  })

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

  const emptyStudent: Student = {
    id: 0,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    nationality: 'Nepalese',
    studentId: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    currentClass: '',
    section: '',
    rollNumber: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    guardianRelation: '',
    primaryPhone: '',
    secondaryPhone: '',
    email: '',
    homeAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    previousSchool: '',
    subjects: '',
    feeCategory: 'Regular',
    house: '',
    medicalConditions: '',
    allergies: '',
    medications: '',
    specialNeeds: '',
    bloodGroup: '',
    rfidNumber: '',
    busRoute: '',
    uniformSize: '',
    pickupAddress: '',
    dropoffAddress: '',
    driverInfo: '',
    status: 'Active',
    username: '',
    notes: '',
    password: '',
  }

  const [formData, setFormData] = useState<Student>(emptyStudent)

  // Generate unique Student ID
  // Generate unique Student ID
  const generateStudentID = () => {
    const currentYear = new Date().getFullYear()
    const prefix = `STU-${currentYear}`

    const maxSequence = students.reduce((max, s) => {
      if (s.studentId && s.studentId.startsWith(prefix)) {
        const parts = s.studentId.split('-')
        if (parts.length === 3) {
          const seq = parseInt(parts[2], 10)
          return !isNaN(seq) && seq > max ? seq : max
        }
      }
      return max
    }, 0)

    return `${prefix}-${String(maxSequence + 1).padStart(4, '0')}`
  }

  const handleAddClick = () => {
    const newStudent = {
      ...emptyStudent,
      studentId: generateStudentID()
    }
    setFormData(newStudent)
    setActiveTab('basic')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData(emptyStudent)
    setCustomGuardianRelation('')
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this student?')) {
      setStudents((prev) => prev.filter((student) => student.id !== id))
    }
  }

  const handleEditClick = (student: Student) => {
    setEditingStudentId(student.id)
    setFormData(student)
    setActiveTab('basic')
    setShowEditModal(true)
    // If the guardian relation is not in the predefined list, set it as custom
    if (student.guardianRelation && !GUARDIAN_RELATIONS.slice(0, -1).includes(student.guardianRelation)) {
      setCustomGuardianRelation(student.guardianRelation)
      setFormData((prev) => ({ ...prev, guardianRelation: 'Other (specify)' }))
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingStudentId(null)
    setFormData(emptyStudent)
    setCustomGuardianRelation('')
  }

  const handleGuardianRelationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, guardianRelation: value }))
    if (value === 'Other (specify)') {
      // Keep the custom value if switching to Other
      if (customGuardianRelation === '') {
        setFormData((prev) => ({ ...prev, guardianRelation: '' }))
      }
    } else {
      setCustomGuardianRelation('')
    }
  }

  const handleCustomGuardianRelationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomGuardianRelation(value)
    setFormData((prev) => ({ ...prev, guardianRelation: value }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newStudent = {
      ...formData,
      id: Math.max(...students.map((s) => s.id), 0) + 1,
    }
    setStudents((prev) => [...prev, newStudent])
    handleCloseModal()
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingStudentId === null) return
    setStudents((prev) =>
      prev.map((student) =>
        student.id === editingStudentId ? formData : student
      )
    )
    handleCloseEditModal()
  }

  const handleChangePasswordClick = (studentId: number) => {
    setPasswordForm({ id: studentId, password: '' })
    setShowPasswordModal(true)
    setActiveDropdownId(null)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would call the API to update the password here
    alert(`Password updated for student ID: ${passwordForm.id}`)
    setShowPasswordModal(false)
  }

  const handleLoginAsStudent = (student: Student) => {
    // Redirect to login page with email pre-filled
    setActiveDropdownId(null)
    router.push({
      pathname: '/auth/login',
      query: { email: student.email }
    })
  }

  // Filter Logic
  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query) ||
      student.primaryPhone.includes(query)

    const matchesClass = filters.class ? student.currentClass === filters.class : true
    const matchesSection = filters.section ? student.section === filters.section : true
    const matchesStatus = filters.status ? student.status === filters.status : true
    const matchesGender = filters.gender ? student.gender === filters.gender : true

    return matchesSearch && matchesClass && matchesSection && matchesStatus && matchesGender
  })

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({ class: '', section: '', status: '', gender: '' })
  }

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStudents = localStorage.getItem('students')
      if (savedStudents) {
        try {
          setStudents(JSON.parse(savedStudents))
        } catch (error) {
          console.error('Failed to load students:', error)
          setStudents(DEFAULT_STUDENTS)
        }
      }
      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('students', JSON.stringify(students))
    }
  }, [students, isHydrated])

  // Handle Edit Action from Query Params
  useEffect(() => {
    if (isHydrated && router.query.action === 'edit' && router.query.id && students.length > 0) {
      const studentId = Number(router.query.id)
      const foundStudent = students.find(s => s.id === studentId)
      if (foundStudent) {
        handleEditClick(foundStudent)
        // Clear query to prevents reopening on refresh
        router.replace('/dashboard/students', undefined, { shallow: true })
      }
    }
  }, [isHydrated, router.query, students])

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
              Students Management
            </h1>
            <p className="text-gray-600">Manage student information and records</p>
          </div>

          {/* Add Button */}
          {/* Search & Actions Bar */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 w-full md:w-auto relative group">
                <input
                  type="text"
                  placeholder="Search by Name, ID, Email, or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-96 px-5 py-3 pl-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md"
                />
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-xl border font-medium flex items-center gap-2 transition-all duration-200 ${showFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {(filters.class || filters.section || filters.status || filters.gender) && (
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                </button>

                <button
                  onClick={handleAddClick}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="text-xl">+</span>
                  Add Student
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animation-fade-in-down">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Class</label>
                    <select
                      value={filters.class}
                      onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50/50"
                    >
                      <option value="">All Classes</option>
                      {/* Unique classes from students */}
                      {[...new Set(students.map(s => s.currentClass))].sort().map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Section</label>
                    <select
                      value={filters.section}
                      onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50/50"
                    >
                      <option value="">All Sections</option>
                      {[...new Set(students.map(s => s.section))].filter(Boolean).sort().map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50/50"
                    >
                      <option value="">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Graduated">Graduated</option>
                      <option value="Left">Left</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Gender</label>
                    <select
                      value={filters.gender}
                      onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50/50"
                    >
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-4 pt-4 border-t border-gray-50">
                  <button
                    onClick={clearFilters}
                    className="text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-visible border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="px-6 py-4 text-left font-semibold">Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Student ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Class</th>
                  <th className="px-6 py-4 text-left font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-medium">No students match your search</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting keywords or filters</p>
                        <button onClick={clearFilters} className="mt-4 text-blue-600 font-semibold hover:underline">
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/students/${student.id}`}>
                          <div className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
                            {student.firstName} {student.lastName}
                          </div>
                        </Link>
                        <div className="text-sm text-gray-500">{student.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium text-sm">
                          {student.studentId}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{student.currentClass}</td>
                      <td className="px-6 py-4 text-gray-600">{student.primaryPhone}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${student.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : student.status === 'Inactive'
                              ? 'bg-red-100 text-red-700'
                              : student.status === 'Graduated'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === student.id ? null : student.id)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          {activeDropdownId === student.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden animation-fade-in-up">
                              <div className="py-1">
                                <button
                                  onClick={() => { handleEditClick(student); setActiveDropdownId(null) }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <span>✏️</span> Edit Details
                                </button>
                                <button
                                  onClick={() => handleChangePasswordClick(student.id)}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <span>🔑</span> Change Password
                                </button>
                                <button
                                  onClick={() => handleLoginAsStudent(student)}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <span>👤</span> Login as Student
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => { handleDelete(student.id); setActiveDropdownId(null) }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <span>🗑️</span> Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Overlay to close dropdown when clicking outside */}
                        {activeDropdownId === student.id && (
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

          {/* Add Student Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[75vh] max-h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5 border-b-2 border-blue-200">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Add New Student</h3>
                  <p className="text-sm text-gray-500 mt-1">Fill in the student details in the sections below</p>
                </div>

                {/* Tabs - Sticky Navigation */}
                <div className="sticky top-0 z-10 flex border-b-2 border-blue-200 bg-gradient-to-r from-gray-50 to-blue-50 shadow-md">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-4 py-4 text-sm font-bold transition-all duration-200 relative ${activeTab === tab.id
                        ? 'text-blue-600 bg-white'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                        }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 p-6 bg-white overflow-y-auto">
                  {/* Basic Profile */}
                  {activeTab === 'basic' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-0 bg-white hover:border-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-0 bg-white hover:border-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        <NepaliDatePicker
                          value={formData.dateOfBirth}
                          onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nationality
                        </label>
                        <select
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {NATIONALITIES.map((nat) => (
                            <option key={nat} value={nat}>{nat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Enrollment Date
                        </label>
                        <NepaliDatePicker
                          value={formData.enrollmentDate}
                          onChange={(date) => setFormData({ ...formData, enrollmentDate: date })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Class *
                        </label>
                        <input
                          type="text"
                          name="currentClass"
                          value={formData.currentClass}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Section
                        </label>
                        <input
                          type="text"
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Roll Number
                        </label>
                        <input
                          type="text"
                          name="rollNumber"
                          value={formData.rollNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Student ID (Auto-generated)
                        </label>
                        <input
                          type="text"
                          name="studentId"
                          value={formData.studentId}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required={!editingStudentId} // Required only when creating new student
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-0 bg-white hover:border-gray-400 transition-colors"
                          placeholder={editingStudentId ? "Leave blank to keep current" : "Enter password"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Graduated">Graduated</option>
                          <option value="Left">Left</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Guardian Details */}
                  {activeTab === 'guardian' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Father's Name
                        </label>
                        <input
                          type="text"
                          name="fatherName"
                          value={formData.fatherName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mother's Name
                        </label>
                        <input
                          type="text"
                          name="motherName"
                          value={formData.motherName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Guardian Name (if different)
                        </label>
                        <input
                          type="text"
                          name="guardianName"
                          value={formData.guardianName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Guardian Relation
                        </label>
                        <select
                          value={formData.guardianRelation === customGuardianRelation && customGuardianRelation !== '' ? 'Other (specify)' : formData.guardianRelation}
                          onChange={handleGuardianRelationChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Relation</option>
                          {GUARDIAN_RELATIONS.map((rel) => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                        </select>
                        {formData.guardianRelation === 'Other (specify)' && (
                          <input
                            type="text"
                            placeholder="Please specify the relation"
                            value={customGuardianRelation}
                            onChange={handleCustomGuardianRelationChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Phone *
                        </label>
                        <input
                          type="tel"
                          name="primaryPhone"
                          value={formData.primaryPhone}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Secondary Phone
                        </label>
                        <input
                          type="tel"
                          name="secondaryPhone"
                          value={formData.secondaryPhone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Home Address
                        </label>
                        <textarea
                          name="homeAddress"
                          value={formData.homeAddress}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emergency Contact Phone
                        </label>
                        <input
                          type="tel"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relation
                        </label>
                        <input
                          type="text"
                          name="emergencyContactRelation"
                          value={formData.emergencyContactRelation}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Academic */}
                  {activeTab === 'academic' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Previous School
                        </label>
                        <input
                          type="text"
                          name="previousSchool"
                          value={formData.previousSchool}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subjects Enrolled
                        </label>
                        <textarea
                          name="subjects"
                          value={formData.subjects}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter subjects separated by comma"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fee Category
                        </label>
                        <select
                          name="feeCategory"
                          value={formData.feeCategory}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Regular">Regular</option>
                          <option value="Scholarship">Scholarship</option>
                          <option value="Concession">Concession</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          House/Team
                        </label>
                        <input
                          type="text"
                          name="house"
                          value={formData.house}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Health & Safety */}
                  {activeTab === 'health' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Blood Group
                        </label>
                        <input
                          type="text"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medical Conditions
                        </label>
                        <input
                          type="text"
                          name="medicalConditions"
                          value={formData.medicalConditions}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Allergies
                        </label>
                        <textarea
                          name="allergies"
                          value={formData.allergies}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medications
                        </label>
                        <textarea
                          name="medications"
                          value={formData.medications}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Special Needs / Learning Support
                        </label>
                        <textarea
                          name="specialNeeds"
                          value={formData.specialNeeds}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* ID & Transport */}
                  {activeTab === 'attendance' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RFID / Barcode Number
                        </label>
                        <input
                          type="text"
                          name="rfidNumber"
                          value={formData.rfidNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bus Route
                        </label>
                        <input
                          type="text"
                          name="busRoute"
                          value={formData.busRoute}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Uniform Size
                        </label>
                        <input
                          type="text"
                          name="uniformSize"
                          value={formData.uniformSize}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pickup Address
                        </label>
                        <textarea
                          name="pickupAddress"
                          value={formData.pickupAddress}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Drop-off Address
                        </label>
                        <textarea
                          name="dropoffAddress"
                          value={formData.dropoffAddress}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Driver & Vehicle Info
                        </label>
                        <textarea
                          name="driverInfo"
                          value={formData.driverInfo}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}



                  <div className="flex gap-3 pt-6 mt-8 border-t-2 border-gray-100">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg hover:scale-105 font-semibold transition-all duration-200"
                    >
                      Add Student
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
          }

          {/* Edit Student Modal */}
          {
            showEditModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[75vh] max-h-[90vh] flex flex-col overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-5 border-b-2 border-purple-200">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Edit Student</h3>
                    <p className="text-sm text-gray-500 mt-1">Update the student details in the sections below</p>
                  </div>

                  {/* Tabs - Sticky Navigation */}
                  <div className="sticky top-0 z-10 flex border-b-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 shadow-md">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 py-4 text-sm font-bold transition-all duration-200 relative ${activeTab === tab.id
                          ? 'text-purple-600 bg-white'
                          : 'text-gray-600 hover:text-purple-600 hover:bg-gray-100'
                          }`}
                      >
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-blue-600"></div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Form - Same as Add Modal */}
                  <form onSubmit={handleEditSubmit} className="flex-1 p-6 bg-white overflow-y-auto">
                    {/* Basic Profile */}
                    {activeTab === 'basic' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nationality
                          </label>
                          <select
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {NATIONALITIES.map((nat) => (
                              <option key={nat} value={nat}>{nat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Enrollment Date
                          </label>
                          <input
                            type="date"
                            name="enrollmentDate"
                            value={formData.enrollmentDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Class *
                          </label>
                          <input
                            type="text"
                            name="currentClass"
                            value={formData.currentClass}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section
                          </label>
                          <input
                            type="text"
                            name="section"
                            value={formData.section}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Roll Number
                          </label>
                          <input
                            type="text"
                            name="rollNumber"
                            value={formData.rollNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Student ID (Auto-generated)
                          </label>
                          <input
                            type="text"
                            name="studentId"
                            value={formData.studentId}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Graduated">Graduated</option>
                            <option value="Left">Left</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Guardian Details */}
                    {activeTab === 'guardian' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Father's Name
                          </label>
                          <input
                            type="text"
                            name="fatherName"
                            value={formData.fatherName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mother's Name
                          </label>
                          <input
                            type="text"
                            name="motherName"
                            value={formData.motherName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Guardian Name (if different)
                          </label>
                          <input
                            type="text"
                            name="guardianName"
                            value={formData.guardianName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Guardian Relation
                          </label>
                          <select
                            value={formData.guardianRelation === customGuardianRelation && customGuardianRelation !== '' ? 'Other (specify)' : formData.guardianRelation}
                            onChange={handleGuardianRelationChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Relation</option>
                            {GUARDIAN_RELATIONS.map((rel) => (
                              <option key={rel} value={rel}>{rel}</option>
                            ))}
                          </select>
                          {formData.guardianRelation === 'Other (specify)' && (
                            <input
                              type="text"
                              placeholder="Please specify the relation"
                              value={customGuardianRelation}
                              onChange={handleCustomGuardianRelationChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Primary Phone *
                          </label>
                          <input
                            type="tel"
                            name="primaryPhone"
                            value={formData.primaryPhone}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Secondary Phone
                          </label>
                          <input
                            type="tel"
                            name="secondaryPhone"
                            value={formData.secondaryPhone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Home Address
                          </label>
                          <textarea
                            name="homeAddress"
                            value={formData.homeAddress}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Emergency Contact Name
                          </label>
                          <input
                            type="text"
                            name="emergencyContactName"
                            value={formData.emergencyContactName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Emergency Contact Phone
                          </label>
                          <input
                            type="tel"
                            name="emergencyContactPhone"
                            value={formData.emergencyContactPhone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Relation
                          </label>
                          <input
                            type="text"
                            name="emergencyContactRelation"
                            value={formData.emergencyContactRelation}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Academic */}
                    {activeTab === 'academic' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Previous School
                          </label>
                          <input
                            type="text"
                            name="previousSchool"
                            value={formData.previousSchool}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subjects Enrolled
                          </label>
                          <textarea
                            name="subjects"
                            value={formData.subjects}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter subjects separated by comma"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fee Category
                          </label>
                          <select
                            name="feeCategory"
                            value={formData.feeCategory}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Regular">Regular</option>
                            <option value="Scholarship">Scholarship</option>
                            <option value="Concession">Concession</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            House/Team
                          </label>
                          <input
                            type="text"
                            name="house"
                            value={formData.house}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Health & Safety */}
                    {activeTab === 'health' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Blood Group
                          </label>
                          <input
                            type="text"
                            name="bloodGroup"
                            value={formData.bloodGroup}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medical Conditions
                          </label>
                          <input
                            type="text"
                            name="medicalConditions"
                            value={formData.medicalConditions}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Allergies
                          </label>
                          <textarea
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medications
                          </label>
                          <textarea
                            name="medications"
                            value={formData.medications}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Special Needs / Learning Support
                          </label>
                          <textarea
                            name="specialNeeds"
                            value={formData.specialNeeds}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* ID & Transport */}
                    {activeTab === 'attendance' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            RFID / Barcode Number
                          </label>
                          <input
                            type="text"
                            name="rfidNumber"
                            value={formData.rfidNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bus Route
                          </label>
                          <input
                            type="text"
                            name="busRoute"
                            value={formData.busRoute}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Uniform Size
                          </label>
                          <input
                            type="text"
                            name="uniformSize"
                            value={formData.uniformSize}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pickup Address
                          </label>
                          <textarea
                            name="pickupAddress"
                            value={formData.pickupAddress}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Drop-off Address
                          </label>
                          <textarea
                            name="dropoffAddress"
                            value={formData.dropoffAddress}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Driver & Vehicle Info
                          </label>
                          <textarea
                            name="driverInfo"
                            value={formData.driverInfo}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}



                    <div className="flex gap-3 pt-6 mt-8 border-t-2 border-gray-100">
                      <button
                        type="button"
                        onClick={handleCloseEditModal}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg hover:scale-105 font-semibold transition-all duration-200"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div >
              </div >
            )
          }
        </main >
      </div >
    </div >
  )
}
