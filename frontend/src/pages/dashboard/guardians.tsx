import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { guardianAPI, studentAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

interface Guardian {
  id: string
  guardian_id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  alternate_phone: string
  relationship: string
  date_of_birth: string
  gender: string
  marital_status: string
  occupation: string
  company: string
  income: number
  address: string
  city: string
  state: string
  zip_code: string
  linked_students: string[]
  communication_preference: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_relationship: string
  status: 'active' | 'inactive'
  notes: string
  [key: string]: any
}

interface StudentOption {
  id: string
  firstName: string
  lastName: string
  studentId: string
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  password?: string
  phone_number: string
  alternate_phone: string
  relationship: string
  date_of_birth: string
  gender: string
  marital_status: string
  occupation: string
  company: string
  income: number
  address: string
  city: string
  state: string
  zip_code: string
  linked_students: string[]
  communication_preference: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_relationship: string
  status: 'active' | 'inactive'
  notes: string
  guardian_id: string
}

const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Guardian',
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
  password: '',
  phone_number: '',
  alternate_phone: '',
  relationship: '',
  date_of_birth: '',
  gender: 'Male',
  marital_status: 'Married',
  occupation: '',
  company: '',
  income: 0,
  address: '',
  city: '',
  state: '',
  zip_code: '',
  linked_students: [],
  communication_preference: 'Both',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_relationship: '',
  status: 'active',
  notes: '',
  guardian_id: '',
}

export default function GuardiansPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    relationship: '',
  })
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    guardian: true,
    contactInfo: true,
    relationship: true,
    linkedStudents: true,
    status: true,
    actions: true,
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  useEffect(() => {
    fetchGuardians()
    fetchStudents()
  }, [])

  const fetchGuardians = async () => {
    try {
      setIsLoading(true)
      const response = await guardianAPI.list()
      if (response.data && response.data.parents) {
        setGuardians(response.data.parents)
      }
    } catch (error) {
      console.error('Failed to fetch guardians:', error)
      toast.error('Failed to load guardians')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.list()
      if (response.data && response.data.students) {
        setStudents(response.data.students.map((s: any) => ({
          id: s.id.toString(),
          firstName: s.first_name,
          lastName: s.last_name,
          studentId: s.student_id_number,
        })))
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const generateGuardianId = () => {
    const currentYear = new Date().getFullYear()
    const maxExistingNumber = guardians.length > 0
      ? Math.max(...guardians.map(g => {
        const match = g.guardian_id?.match(/\d+$/)
        return match ? parseInt(match[0]) : 0
      }), 0)
      : 0
    return `GRD${currentYear}${String(maxExistingNumber + 1).padStart(4, '0')}`
  }

  const handleAddGuardian = () => {
    setEditingId(null)
    setFormData({
      ...DEFAULT_FORM_STATE,
      guardian_id: generateGuardianId(),
    })
    setActiveTab('personal')
    setShowModal(true)
  }

  const handleEditGuardian = (guardian: Guardian) => {
    setEditingId(guardian.id)
    setFormData({
      firstName: guardian.first_name,
      lastName: guardian.last_name,
      email: guardian.email,
      phone_number: guardian.phone_number,
      alternate_phone: guardian.alternate_phone,
      relationship: guardian.relationship,
      date_of_birth: guardian.date_of_birth ? new Date(guardian.date_of_birth).toISOString().split('T')[0] : '',
      gender: guardian.gender,
      marital_status: guardian.marital_status,
      occupation: guardian.occupation,
      company: guardian.company,
      income: guardian.income,
      address: guardian.address,
      city: guardian.city,
      state: guardian.state,
      zip_code: guardian.zip_code,
      linked_students: Array.isArray(guardian.linked_students) ? guardian.linked_students : [],
      communication_preference: guardian.communication_preference,
      emergency_contact_name: guardian.emergency_contact_name,
      emergency_contact_phone: guardian.emergency_contact_phone,
      emergency_relationship: guardian.emergency_relationship,
      status: guardian.status as 'active' | 'inactive',
      notes: guardian.notes,
      guardian_id: guardian.guardian_id,
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
      toast.error('Please enter first and last name')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Please enter email address')
      return false
    }
    if (!editingId && !formData.password?.trim()) {
      toast.error('Password is required for new guardians')
      return false
    }
    if (!formData.phone_number.trim()) {
      toast.error('Please enter phone number')
      return false
    }
    if (!formData.relationship) {
      toast.error('Please select relationship to student')
      return false
    }
    return true
  }

  const handleSaveGuardian = async () => {
    if (!validateForm()) return

    const payload = {
      ...formData,
      first_name: formData.firstName,
      last_name: formData.lastName,
      school_id: user?.schoolId,
      date_of_birth: formData.date_of_birth,
    }

    try {
      if (editingId) {
        await guardianAPI.update(editingId, payload)
        toast.success('Guardian updated successfully')
      } else {
        await guardianAPI.create(payload)
        toast.success('Guardian created successfully')
      }
      fetchGuardians()
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving guardian:', error)
      toast.error(error.response?.data?.error || 'Failed to save guardian')
    }
  }

  const handleDeleteGuardian = async (id: string) => {
    if (confirm('Are you sure you want to delete this guardian?')) {
      try {
        await guardianAPI.delete(id)
        toast.success('Guardian deleted successfully')
        fetchGuardians()
      } catch (error) {
        toast.error('Failed to delete guardian')
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'active' | 'inactive') => {
    try {
      await guardianAPI.update(id, { status: newStatus })
      toast.success('Status updated')
      fetchGuardians()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const filteredGuardians = guardians.filter((g) => {
    const matchesSearch =
      `${g.first_name} ${g.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phone_number.includes(searchTerm) ||
      g.guardian_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filters.status ? g.status === filters.status : true
    const matchesRelationship = filters.relationship ? g.relationship === filters.relationship : true

    return matchesSearch && matchesStatus && matchesRelationship
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-6 pb-64 overflow-y-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Guardians Management
            </h1>
            <p className="text-gray-600">Manage parent and guardian profiles linked to students</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Guardians</p>
                <p className="text-2xl font-bold text-gray-900">{guardians.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{guardians.filter(g => g.status?.toLowerCase() === 'active').length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{guardians.length - guardians.filter(g => g.status?.toLowerCase() === 'active').length}</p>
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
                  placeholder="Search by Name, Email, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                          <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Active', 'Inactive'].map(st => (
                              <button
                                key={st}
                                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === st.toLowerCase() ? '' : st.toLowerCase() }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.status === st.toLowerCase() ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} border`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Relationship</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Father', 'Mother', 'Guardian'].map(rel => (
                              <button
                                key={rel}
                                onClick={() => setFilters(prev => ({ ...prev, relationship: prev.relationship === rel ? '' : rel }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.relationship === rel ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} border`}
                              >
                                {rel}
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
                        {['Relationship', 'Status', 'Occupation'].map(group => (
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
                onClick={handleAddGuardian}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <span className="text-xl">+</span>
                Add Guardian
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-visible border border-gray-100">
            <table className="w-full">
              <thead className="relative z-20">
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  {visibleColumns.guardian && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Guardian</th>}
                  {visibleColumns.contactInfo && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Contact Info</th>}
                  {visibleColumns.relationship && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Relationship</th>}
                  {visibleColumns.linkedStudents && <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">Linked Students</th>}
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
                {isLoading ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-medium">Loading guardians...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredGuardians.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-medium">No guardians match your search</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting keywords or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGuardians.map((guardian) => (
                    <tr key={guardian.id} className={`hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 ${activeDropdownId === guardian.id ? 'relative z-30' : ''}`}>
                      {visibleColumns.guardian && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                              {guardian.first_name[0]}{guardian.last_name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900	">
                                {guardian.first_name} {guardian.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{guardian.guardian_id}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.contactInfo && (
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900 font-medium">{guardian.email}</p>
                            <p className="text-gray-500">{guardian.phone_number}</p>
                          </div>
                        </td>
                      )}
                      {visibleColumns.relationship && (
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {guardian.relationship}
                          </span>
                        </td>
                      )}
                      {visibleColumns.linkedStudents && (
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {guardian.linked_students?.length > 0 ? (
                              guardian.linked_students.map((sid: string) => (
                                <div
                                  key={sid}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 shadow-sm"
                                  title={`Full Student ID: ${sid}`}
                                >
                                  {sid}
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">None linked</span>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold inline-block cursor-pointer transition-colors ${guardian.status?.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                              }`}
                            onClick={() => handleStatusChange(guardian.id, guardian.status?.toLowerCase() === 'active' ? 'inactive' : 'active')}
                          >
                            {guardian.status?.toUpperCase()}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === guardian.id ? null : guardian.id)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          {activeDropdownId === guardian.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden animation-fade-in-up">
                              <div className="py-1">
                                <button
                                  onClick={() => { handleEditGuardian(guardian); setActiveDropdownId(null) }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <span>✏️</span> Edit Details
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => { handleDeleteGuardian(guardian.id); setActiveDropdownId(null) }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <span>🗑️</span> Delete Guardian
                                </button>
                              </div>
                            </div>
                          )}
                          {activeDropdownId === guardian.id && (
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setActiveDropdownId(null)}
                            ></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Guardian Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[75vh] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5 border-b-2 border-blue-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingId ? 'Edit Guardian Profile' : 'Register New Guardian'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Fill in the profile information in the sections below</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/50 transition-colors text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs - Sticky Navigation */}
            <div className="sticky top-0 z-10 flex border-b-2 border-blue-200 bg-gradient-to-r from-gray-50 to-blue-50 shadow-md">
              {[
                { id: 'personal', label: 'Personal', icon: '👤' },
                { id: 'contact', label: 'Contact', icon: '📞' },
                { id: 'additional', label: 'Professional', icon: '💼' },
                { id: 'emergency', label: 'Emergency', icon: '🚨' },
                { id: 'students', label: 'Students', icon: '🎓' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 text-sm font-bold transition-all duration-200 relative whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === tab.id
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                >
                  <span className="hidden sm:inline">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                      placeholder="e.g. Ram"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                      placeholder="e.g. Bahadur"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Guardian ID *</label>
                    <input
                      type="text"
                      name="guardian_id"
                      value={formData.guardian_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white opacity-70"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Relationship *</label>
                    <select
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                    >
                      <option value="">Select connection</option>
                      {RELATIONSHIPS.map((rel) => <option key={rel} value={rel}>{rel}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <NepaliDatePicker
                      label="Date of Birth"
                      value={formData.date_of_birth}
                      onChange={(date: string) => setFormData(prev => ({ ...prev, date_of_birth: date }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gender</label>
                    <div className="flex bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, gender: g }))}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.gender === g
                            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Residential Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white resize-none"
                      placeholder="Street, Locality"
                    />
                  </div>
                </div>
              )}

              {/* Contact Details Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                        placeholder="parent@example.com"
                      />
                    </div>
                    {!editingId && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Login Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                          placeholder="••••••••"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Primary Phone *</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                        placeholder="98XXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Alternate Phone</label>
                      <input
                        type="tel"
                        name="alternate_phone"
                        value={formData.alternate_phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Professional Tab */}
              {activeTab === 'additional' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Company / Organization</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Annual Income</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">रु</span>
                      <input
                        type="number"
                        name="income"
                        value={formData.income}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Marital Status</label>
                    <select
                      name="marital_status"
                      value={formData.marital_status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Internal Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Emergency Contact Tab */}
              {activeTab === 'emergency' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                      placeholder="e.g. Hari Pd."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Emergency Relationship</label>
                    <select
                      name="emergency_relationship"
                      value={formData.emergency_relationship}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                    >
                      <option value="">Select relationship</option>
                      {EMERGENCY_RELATIONSHIPS.map((rel) => <option key={rel} value={rel}>{rel}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Emergency Phone</label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Comm. Preference</label>
                    <select
                      name="communication_preference"
                      value={formData.communication_preference}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                    >
                      <option value="Email">Email</option>
                      <option value="Phone">Phone-only</option>
                      <option value="Both">Both Email & Phone</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                      <p className="text-sm text-blue-700 font-medium">Link this guardian to one or more students.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Select Students</label>
                      <div className="relative group">
                        <select
                          multiple
                          value={formData.linked_students}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value)
                            setFormData(prev => ({ ...prev, linked_students: values }))
                          }}
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-900 h-64 shadow-inner"
                        >
                          {students.map(s => (
                            <option key={s.id} value={s.studentId} className="py-2 px-3 mb-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                              {s.firstName} {s.lastName} — {s.studentId}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-4">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Selected Students:</label>
                        <div className="flex flex-wrap gap-2">
                          {formData.linked_students.length > 0 ? (
                            formData.linked_students.map(sid => {
                              const student = students.find(s => s.studentId === sid)
                              return (
                                <span key={sid} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-sm">
                                  {student ? `${student.firstName} ${student.lastName}` : sid}
                                  <button
                                    onClick={() => setFormData(p => ({ ...p, linked_students: p.linked_students.filter(id => id !== sid) }))}
                                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors"
                                  >
                                    ×
                                  </button>
                                </span>
                              )
                            })
                          ) : (
                            <p className="text-sm text-gray-400 italic">No students selected</p>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 italic mt-4">💡 Pro-tip: Hold Ctrl (Windows) or Cmd (Mac) to select multiple students at once.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGuardian}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-lg transform active:scale-95 transition-all"
              >
                {editingId ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
