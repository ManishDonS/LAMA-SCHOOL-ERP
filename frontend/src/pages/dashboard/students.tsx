import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import { studentAPI, guardianAPI, classAPI } from '@/services/api'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { toast } from 'react-hot-toast'

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
  // Linked Guardians
  selectedGuardians: string[] // Array of guardian IDs
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

const DEFAULT_STUDENTS: Student[] = []

const TABS = [
  { id: 'basic', label: 'Basic Profile' },
  { id: 'guardian', label: 'Guardians' },
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
  const [students, setStudents] = useState<Student[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [customGuardianRelation, setCustomGuardianRelation] = useState('')
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ id: 0, password: '' })
  const [availableGuardians, setAvailableGuardians] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    status: '',
    gender: ''
  })
  const [isAddingInlineGuardian, setIsAddingInlineGuardian] = useState(false)
  const [newGuardianFormData, setNewGuardianFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone_number: '',
    relationship: 'Father',
    password: 'ChangeMe@123'
  })

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    studentId: true,
    currentClass: true,
    phone: true,
    status: true,
    actions: true,
    gender: false,
    enrollmentDate: false,
    section: false
  })
  const [showColumnPicker, setShowColumnPicker] = useState(false)

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

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
    selectedGuardians: [],
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

  const handleSaveInlineGuardian = async () => {
    if (!newGuardianFormData.firstName || !newGuardianFormData.lastName || !newGuardianFormData.email || !newGuardianFormData.phone_number) {
      toast.error('Please fill all required guardian fields')
      return
    }

    // Get schoolId from localStorage just like in handleSubmit
    let schoolId = ''
    if (typeof window !== 'undefined') {
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        try {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          schoolId = selectedSchool.id || ''
        } catch (e) {
          console.error('Failed to parse selected_school', e)
        }
      }
    }

    if (!schoolId) {
      toast.error('School ID not found. Please select a school first.')
      return
    }

    const payload = {
      first_name: newGuardianFormData.firstName,
      last_name: newGuardianFormData.lastName,
      email: newGuardianFormData.email,
      phone_number: newGuardianFormData.phone_number,
      relationship: newGuardianFormData.relationship,
      password: newGuardianFormData.password,
      school_id: schoolId,
      status: 'active',
      guardian_id: `GRD${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}` // Temporary ID, backend should handle it ideally but for selection we need it
    }

    try {
      const response = await guardianAPI.create(payload)
      const createdGuardian = response.data.parent || response.data // Handle different response formats

      toast.success('Guardian created successfully')

      // Refresh the available guardians list
      await fetchGuardians()

      // Auto-select the newly created guardian
      const guardianIdToSelect = createdGuardian.guardian_id || payload.guardian_id
      setFormData(prev => ({
        ...prev,
        selectedGuardians: [...prev.selectedGuardians, guardianIdToSelect]
      }))

      // Reset and close inline form
      setIsAddingInlineGuardian(false)
      setNewGuardianFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone_number: '',
        relationship: 'Father',
        password: 'ChangeMe@123'
      })
    } catch (error: any) {
      console.error('Failed to create guardian:', error)
      toast.error(error.response?.data?.error || 'Failed to create guardian')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData(emptyStudent)
    setCustomGuardianRelation('')
    setIsAddingInlineGuardian(false)
  }

  const handleDeleteClick = (id: number) => {
    setSelectedStudentId(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedStudentId) return
    setIsDeleting(true)
    try {
      // In a real app: await studentAPI.delete(selectedStudentId)
      setStudents((prev) => prev.filter((student) => student.id !== selectedStudentId))
      toast.success('Student deleted successfully')
    } catch (error) {
      toast.error('Failed to delete student')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setSelectedStudentId(null)
    }
  }

  const handleEditClick = (student: Student) => {
    setEditingStudentId(student.id)
    setFormData(student)
    setActiveTab('basic')
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingStudentId(null)
    setFormData(emptyStudent)
    setCustomGuardianRelation('')
    setIsAddingInlineGuardian(false)
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get selected school from local storage
    let schoolId = ''
    if (typeof window !== 'undefined') {
      const selectedSchoolStr = localStorage.getItem('selected_school')
      if (selectedSchoolStr) {
        try {
          const selectedSchool = JSON.parse(selectedSchoolStr)
          schoolId = selectedSchool.id || ''
        } catch (e) {
          console.error('Failed to parse selected_school', e)
        }
      }
    }

    if (!schoolId) {
      toast.error('School ID not found. Please select a school first.')
      return
    }

    const newStudentPayload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.username,
      password: 'ChangeMe@123', // Default password
      date_of_birth: formData.dateOfBirth,
      class_id: formData.currentClass, // Using currentClass as class_id for now
      school_id: schoolId,
      // Map other fields as needed by backend
    }

    try {
      const response = await studentAPI.create(newStudentPayload)
      const studentIdNumber = response.data.student_id_number

      // Link guardians
      if (formData.selectedGuardians.length > 0) {
        for (const guardianId of formData.selectedGuardians) {
          // Find the guardian object to get its current linked_students
          const guardian = availableGuardians.find(g => g.guardian_id === guardianId)
          if (guardian) {
            const currentLinked = Array.isArray(guardian.linked_students) ? guardian.linked_students : []
            if (!currentLinked.includes(studentIdNumber)) {
              try {
                // Use guardian.id (database ID) as required by user-service API
                await guardianAPI.update(guardian.id, {
                  linked_students: [...currentLinked, studentIdNumber]
                })
              } catch (linkError) {
                console.error(`Failed to link guardian ${guardianId}:`, linkError)
              }
            }
          }
        }
      }

      // Refresh list
      fetchStudents()
      handleCloseModal()
      toast.success('Student created successfully')
    } catch (error: any) {
      console.error('Failed to create student:', error)
      toast.error(error.response?.data?.error || 'Failed to create student')
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingStudentId === null) return

    try {
      // Prepare update payload
      const updatePayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality,
        class: formData.currentClass,
        section: formData.section,
        roll_number: formData.rollNumber,
        blood_group: formData.bloodGroup,
        address: formData.pickupAddress, // Just an example mapping
      }

      // Call API to update student
      await studentAPI.update(editingStudentId, updatePayload)

      // Link guardians (Sync selection)
      const studentIdNumber = formData.studentId

      // 1. Get current student details to find existing links (not strictly necessary but good for differential update)
      // For simplicity, we'll just update all currently selected guardians
      if (formData.selectedGuardians.length > 0) {
        for (const guardianId of formData.selectedGuardians) {
          const guardian = availableGuardians.find(g => g.guardian_id === guardianId)
          if (guardian) {
            const currentLinked = Array.isArray(guardian.linked_students) ? guardian.linked_students : []
            if (!currentLinked.includes(studentIdNumber)) {
              try {
                await guardianAPI.update(guardian.id, {
                  linked_students: [...currentLinked, studentIdNumber]
                })
              } catch (linkError) {
                console.error(`Failed to link guardian ${guardianId} during edit:`, linkError)
              }
            }
          }
        }
      }

      // Refresh the student list to get updated data
      await fetchStudents()

      // Close the modal
      handleCloseEditModal()
      toast.success('Student details updated successfully')
    } catch (error: any) {
      console.error('Failed to update student:', error)
      toast.error(error.response?.data?.error || 'Failed to update student')
    }
  }

  const handleChangePasswordClick = (studentId: number) => {
    setPasswordForm({ id: studentId, password: '' })
    setShowPasswordModal(true)
    setActiveDropdownId(null)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would call the API to update the password here
    toast.success(`Password updated for student ID: ${passwordForm.id}`)
    setShowPasswordModal(false)
  }

  const handleLoginAsStudent = (student: Student) => {
    // Redirect to login page with email pre-filled
    setActiveDropdownId(null)
    router.push({
      pathname: '/auth/login',
    })
  }

  // Filter Logic
  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query)

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

  // Load from API
  useEffect(() => {
    fetchStudents()
    fetchGuardians()
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await classAPI.list()
      setClasses(response.data.classes || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchGuardians = async () => {
    try {
      const response = await guardianAPI.list()
      setAvailableGuardians(response.data.parents || [])
    } catch (error) {
      console.error('Failed to fetch guardians:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.list()
      // Map API response to frontend model
      // Backend returns snake_case, frontend uses camelCase
      const mappedStudents: Student[] = response.data.students.map((s: any) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        dateOfBirth: s.date_of_birth || '',
        gender: s.gender || 'Male',
        nationality: s.nationality || 'Nepalese',
        studentId: s.student_id_number,
        enrollmentDate: s.enrollment_date || '',
        currentClass: s.class,
        section: s.section,
        rollNumber: s.roll_number || '',
        selectedGuardians: s.linked_guardians || [], // Assuming backend might provide this eventually
        previousSchool: s.previous_school || '',
        subjects: s.subjects || '',
        feeCategory: s.fee_category || 'Regular',
        house: s.house || '',
        medicalConditions: s.medical_conditions || '',
        allergies: s.allergies || '',
        medications: s.medications || '',
        specialNeeds: s.special_needs || '',
        bloodGroup: s.blood_group || '',
        rfidNumber: s.rfid_number || '',
        busRoute: s.bus_route || '',
        uniformSize: s.uniform_size || '',
        pickupAddress: s.pickup_address || '',
        dropoffAddress: s.dropoff_address || '',
        driverInfo: s.driver_info || '',
        status: s.status || 'Active',
        username: s.email || '',
        notes: s.notes || '',
      }))
      setStudents(mappedStudents)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      // Provide empty list or keep existing state on error, but don't fallback to dummy 'John Doe'
      setStudents([])
    } finally {
      setIsHydrated(true)
    }
  }

  const activeFiltersCount = [filters.class, filters.section, filters.status, filters.gender].filter(Boolean).length;

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status?.toLowerCase() === 'active').length;
  const inactiveStudents = totalStudents - activeStudents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />

        <div className="flex-1">

          {/* Main Content */}
          <main className="flex-1 py-8 px-6 pb-64 overflow-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Students Management
              </h1>
              <p className="text-gray-600">Manage student information and records</p>
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
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{activeStudents}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{inactiveStudents}</p>
                </div>
              </div>
            </div>

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
                            <label className="text-xs font-bold text-gray-500 uppercase">Class</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[...new Set(students.map(s => s.currentClass))].sort().map(cls => (
                                <button
                                  key={cls}
                                  onClick={() => setFilters(prev => ({ ...prev, class: prev.class === cls ? '' : cls }))}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.class === cls ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} border`}
                                >
                                  {cls}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Active', 'Inactive', 'Graduated'].map(st => (
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
                          {['Class', 'Section', 'Status', 'Gender'].map(group => (
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
                  onClick={handleAddClick}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="text-xl">+</span>
                  Add Student
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-xl overflow-visible border border-gray-100">
              <table className="w-full">
                <thead className="relative z-20">
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    {visibleColumns.name && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Name</th>}
                    {visibleColumns.studentId && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Student ID</th>}
                    {visibleColumns.currentClass && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Class</th>}
                    {visibleColumns.section && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Section</th>}
                    {visibleColumns.gender && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Gender</th>}
                    {visibleColumns.enrollmentDate && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Enrollment Date</th>}
                    {visibleColumns.phone && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Phone</th>}
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
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-gray-500">
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
                      <tr key={student.id} className={`hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 ${activeDropdownId === student.id ? 'relative z-30' : ''}`}>
                        {visibleColumns.name && (
                          <td className="px-6 py-4">
                            <Link href={`/dashboard/students/${student.id}`}>
                              <div className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
                                {student.firstName} {student.lastName}
                              </div>
                            </Link>
                            <div className="text-sm text-gray-500">{student.username}</div>
                          </td>
                        )}
                        {visibleColumns.studentId && (
                          <td className="px-6 py-4">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium text-sm">
                              {student.studentId}
                            </span>
                          </td>
                        )}
                        {visibleColumns.currentClass && <td className="px-6 py-4 font-semibold text-gray-900">{student.currentClass}</td>}
                        {visibleColumns.section && <td className="px-6 py-4 text-gray-600">{student.section || 'N/A'}</td>}
                        {visibleColumns.gender && <td className="px-6 py-4 text-gray-600">{student.gender}</td>}
                        {visibleColumns.enrollmentDate && <td className="px-6 py-4 text-gray-600">{student.enrollmentDate || 'N/A'}</td>}
                        {visibleColumns.phone && <td className="px-6 py-4 text-gray-600 text-sm">{student.username}</td>}
                        {visibleColumns.status && (
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${student.status?.toLowerCase() === 'active'
                                ? 'bg-green-100 text-green-700'
                                : student.status?.toLowerCase() === 'inactive'
                                  ? 'bg-red-100 text-red-700'
                                  : student.status?.toLowerCase() === 'graduated'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {student.status?.charAt(0).toUpperCase() + student.status?.slice(1)}
                            </span>
                          </td>
                        )}
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
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-100 animate-fade-in-up">
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
                                    onClick={() => handleDeleteClick(student.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <span>🗑️</span> Delete Student
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
                          <select
                            name="currentClass"
                            value={formData.currentClass}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Class</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
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

                    {/* Guardians Tab */}
                    {activeTab === 'guardian' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mb-4">
                          <span className="text-xl">ℹ️</span>
                          <div>
                            <p className="text-sm text-blue-800 font-medium">Link or Create Guardians</p>
                            <p className="text-xs text-blue-600 mt-1">Select existing guardians or create a new one directly for this student.</p>
                          </div>
                        </div>

                        {/* Inline Guardian Creation */}
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-semibold text-gray-700">
                            {isAddingInlineGuardian ? 'Register New Guardian' : 'Select Existing Guardians'}
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsAddingInlineGuardian(!isAddingInlineGuardian)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isAddingInlineGuardian
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                          >
                            {isAddingInlineGuardian ? '✕ Cancel' : '+ Add New Guardian'}
                          </button>
                        </div>

                        {isAddingInlineGuardian ? (
                          <div className="bg-gray-50 p-5 rounded-2xl border-2 border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <input
                                  type="text"
                                  placeholder="First Name *"
                                  value={newGuardianFormData.firstName}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, firstName: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Last Name *"
                                  value={newGuardianFormData.lastName}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, lastName: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                />
                              </div>
                              <div>
                                <input
                                  type="email"
                                  placeholder="Email Address *"
                                  value={newGuardianFormData.email}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, email: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                />
                              </div>
                              <div>
                                <input
                                  type="tel"
                                  placeholder="Phone Number *"
                                  value={newGuardianFormData.phone_number}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, phone_number: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                />
                              </div>
                              <div>
                                <select
                                  value={newGuardianFormData.relationship}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, relationship: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                  {GUARDIAN_RELATIONS.filter(r => r !== 'Other (specify)').map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={handleSaveInlineGuardian}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"
                              >
                                Save & Select
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                              {availableGuardians.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 italic">
                                  No guardians found. Use the button above to create one.
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100">
                                  {availableGuardians.map((guardian) => (
                                    <label
                                      key={guardian.id}
                                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.selectedGuardians.includes(guardian.guardian_id)}
                                        onChange={(e) => {
                                          const checked = e.target.checked
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedGuardians: checked
                                              ? [...prev.selectedGuardians, guardian.guardian_id]
                                              : prev.selectedGuardians.filter(id => id !== guardian.guardian_id)
                                          }))
                                        }}
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 mr-3"
                                      />
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-900">
                                          {guardian.first_name} {guardian.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ID: {guardian.guardian_id} | {guardian.relationship}
                                        </div>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {guardian.phone_number}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
            )}

            {/* Edit Student Modal */}
            {showEditModal && (
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
                          <select
                            name="currentClass"
                            value={formData.currentClass}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Class</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
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

                    {/* Guardians Tab */}
                    {activeTab === 'guardian' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3 mb-4">
                          <span className="text-xl">ℹ️</span>
                          <div>
                            <p className="text-sm text-purple-800 font-medium">Link or Create Guardians</p>
                            <p className="text-xs text-purple-600 mt-1">Select existing guardians or create a new one directly for this student.</p>
                          </div>
                        </div>

                        {/* Inline Guardian Creation */}
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-semibold text-gray-700">
                            {isAddingInlineGuardian ? 'Register New Guardian' : 'Select Existing Guardians'}
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsAddingInlineGuardian(!isAddingInlineGuardian)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isAddingInlineGuardian
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                          >
                            {isAddingInlineGuardian ? '✕ Cancel' : '+ Add New Guardian'}
                          </button>
                        </div>

                        {isAddingInlineGuardian ? (
                          <div className="bg-gray-50 p-5 rounded-2xl border-2 border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <input
                                  type="text"
                                  placeholder="First Name *"
                                  value={newGuardianFormData.firstName}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, firstName: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Last Name *"
                                  value={newGuardianFormData.lastName}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, lastName: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                />
                              </div>
                              <div>
                                <input
                                  type="email"
                                  placeholder="Email Address *"
                                  value={newGuardianFormData.email}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, email: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                />
                              </div>
                              <div>
                                <input
                                  type="tel"
                                  placeholder="Phone Number *"
                                  value={newGuardianFormData.phone_number}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, phone_number: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                />
                              </div>
                              <div>
                                <select
                                  value={newGuardianFormData.relationship}
                                  onChange={(e) => setNewGuardianFormData({ ...newGuardianFormData, relationship: e.target.value })}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                >
                                  {GUARDIAN_RELATIONS.filter(r => r !== 'Other (specify)').map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={handleSaveInlineGuardian}
                                className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md transition-all active:scale-95"
                              >
                                Save & Select
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                              {availableGuardians.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 italic">
                                  No guardians found. Create guardians in the Guardians module first.
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100">
                                  {availableGuardians.map((guardian) => (
                                    <label
                                      key={guardian.id}
                                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.selectedGuardians.includes(guardian.guardian_id)}
                                        onChange={(e) => {
                                          const checked = e.target.checked
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedGuardians: checked
                                              ? [...prev.selectedGuardians, guardian.guardian_id]
                                              : prev.selectedGuardians.filter(id => id !== guardian.guardian_id)
                                          }))
                                        }}
                                        className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300 mr-3"
                                      />
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-900">
                                          {guardian.first_name} {guardian.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ID: {guardian.guardian_id} | {guardian.relationship}
                                        </div>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {guardian.phone_number}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-8 py-6 border-b-2 border-red-100">
              <h3 className="text-2xl font-bold text-red-600 flex items-center gap-3">
                <span className="p-2 bg-red-100 rounded-lg text-xl">⚠️</span>
                Delete Student
              </h3>
            </div>
            <div className="p-8">
              <p className="text-gray-600 text-lg leading-relaxed">
                Are you sure you want to delete this student? This action <span className="text-red-600 font-bold underline">cannot be undone</span> and all related data will be permanently removed.
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
