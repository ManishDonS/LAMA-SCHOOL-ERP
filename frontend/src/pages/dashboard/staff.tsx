import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Users, Briefcase, Phone, Mail, MapPin,
  Search, Plus, Filter, MoreVertical, Trash2, Edit2,
  Building2, GraduationCap, Calendar, X, Loader2,
  CheckCircle2, AlertCircle, LayoutGrid, List
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { staffAPI, departmentAPI } from '@/services/api'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { useAuthStore } from '@/store/authStore'

// Types
interface StaffMember {
  id: string
  school_id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  position: string
  employee_id: string
  address: string
  city: string
  state: string
  zip_code: string
  qualification: string
  experience: number
  salary: number
  notes: string
  join_date: string
  status: 'active' | 'inactive' | 'on_leave'
  created_at: string
}

interface Department {
  id: string
  school_id: string
  name: string
  description: string
  head_of_department: string
  created_at: string
  updated_at: string
}

const POSITIONS = [
  'Principal', 'Vice Principal', 'Teacher', 'Assistant Teacher',
  'Counselor', 'Librarian', 'Administrative Staff', 'Support Staff',
  'Driver', 'Security', 'Accountant', 'IT Administrator'
]

const QUALIFICATIONS = [
  'High School', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree',
  'Ph.D.', 'B.Ed.', 'M.Ed.', 'B.Tech', 'M.Tech', 'MBA', 'CA', 'Other'
]

const ACCESS_LEVELS = ['Staff', 'Admin', 'Teacher', 'Support'] // Kept for UI consistency if needed, though role handles this

export default function StaffPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // State
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  // Modal State
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'contact'>('personal')
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employee_id: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    qualification: '',
    experience: 0,
    salary: 0,
    notes: '',
    join_date: '',
    status: 'active',
  })

  // Department Form State
  const [departmentForm, setDepartmentForm] = useState({
    id: '',
    name: '',
    description: '',
    head_of_department: ''
  })
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [staffRes, deptRes] = await Promise.all([
        staffAPI.list({ school_id: user?.schoolId }),
        departmentAPI.list({ school_id: user?.schoolId })
      ])
      setStaffMembers(staffRes.data.staff || [])
      setDepartments(deptRes.data.departments || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.schoolId) {
      fetchData()
    }
  }, [user?.schoolId])

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' || name === 'salary' ? (Number(value) || 0) : value
    }))
  }

  const handleOpenStaffModal = (staff?: StaffMember) => {
    if (staff) {
      setEditingStaff(staff)
      setFormData({
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        phone: staff.phone,
        department: staff.department,
        position: staff.position,
        employee_id: staff.employee_id,
        address: staff.address,
        city: staff.city,
        state: staff.state,
        zip_code: staff.zip_code,
        qualification: staff.qualification,
        experience: staff.experience,
        salary: staff.salary,
        notes: staff.notes,
        join_date: staff.join_date ? new Date(staff.join_date).toISOString().split('T')[0] : '',
        status: staff.status,
      })
    } else {
      setEditingStaff(null)
      setFormData({
        first_name: '', last_name: '', email: '', phone: '',
        department: departments[0]?.name || '', position: 'Teacher', employee_id: '',
        address: '', city: '', state: '', zip_code: '',
        qualification: 'Bachelor\'s Degree', experience: 0, salary: 0,
        notes: '', join_date: new Date().toISOString().split('T')[0], status: 'active'
      })
    }
    setActiveTab('personal')
    setShowStaffModal(true)
  }

  const handleSaveStaff = async () => {
    try {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        toast.error('Please fill in all required fields')
        return
      }

      const payload = {
        ...formData,
        school_id: user?.schoolId,
      }

      if (editingStaff) {
        await staffAPI.update(editingStaff.id, payload)
        toast.success('Staff member updated successfully')
      } else {
        await staffAPI.create(payload)
        toast.success('Staff member added successfully')
      }

      setShowStaffModal(false)
      fetchData()
    } catch (error: any) {
      console.error('Error saving staff:', error)
      toast.error(error.response?.data?.error || 'Failed to save staff member')
    }
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
      try {
        await staffAPI.delete(id)
        toast.success('Staff member removed')
        setStaffMembers(prev => prev.filter(s => s.id !== id))
      } catch (error) {
        toast.error('Failed to remove staff member')
      }
    }
  }

  // Department Handlers
  const handleSaveDepartment = async () => {
    try {
      if (!departmentForm.name) {
        toast.error('Department name is required')
        return
      }

      if (editingDepartmentId) {
        await departmentAPI.update(editingDepartmentId, {
          ...departmentForm,
          school_id: user?.schoolId
        })
        toast.success('Department updated')
      } else {
        await departmentAPI.create({
          ...departmentForm,
          school_id: user?.schoolId
        })
        toast.success('Department created')
      }

      setShowDepartmentModal(false)
      setDepartmentForm({ id: '', name: '', description: '', head_of_department: '' })
      setEditingDepartmentId(null)
      fetchData() // Refresh both to update dropdowns
    } catch (error) {
      toast.error('Failed to save department')
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (window.confirm('Delete this department?')) {
      try {
        await departmentAPI.delete(id)
        toast.success('Department deleted')
        setDepartments(prev => prev.filter(d => d.id !== id))
      } catch (error) {
        toast.error('Failed to delete department')
      }
    }
  }

  // Filter Logic
  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch =
      staff.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDept = filterDepartment === 'All' || staff.department === filterDepartment
    const matchesStatus = filterStatus === 'All' || staff.status === filterStatus

    return matchesSearch && matchesDept && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-inter">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Staff Management</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your school's faculty and staff members</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDepartmentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Building2 size={18} />
                Departments
              </button>
              <button
                onClick={() => handleOpenStaffModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus size={18} />
                Add Staff
              </button>
            </div>
          </div>

          {/* Filters & Controls */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="All">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="md:w-40">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                <Users className="text-blue-500" size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Staff Members Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
                Matches for your search criteria or add your first staff member to get started.
              </p>
              <button
                onClick={() => handleOpenStaffModal()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
              >
                Add Staff Member
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
            }>
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group
                    ${viewMode === 'list' ? 'flex flex-row items-center p-4 gap-6' : ''}`}
                >
                  <div className={`p-6 ${viewMode === 'list' ? 'p-0 flex-1 flex items-center gap-6' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {staff.first_name[0]}{staff.last_name[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {staff.first_name} {staff.last_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{staff.position}</p>
                        </div>
                      </div>
                      <div className={`flex gap-2 ${viewMode === 'list' ? 'hidden' : ''}`}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border
                          ${staff.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                            staff.status === 'on_leave' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                              'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                          {staff.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className={`space-y-2.5 ${viewMode === 'list' ? 'flex gap-8 space-y-0 items-center' : ''}`}>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Building2 size={16} className="text-gray-400" />
                        <span>{staff.department || 'No Department'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Mail size={16} className="text-gray-400" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Phone size={16} className="text-gray-400" />
                        <span>{staff.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center ${viewMode === 'list' ? 'bg-transparent border-0 p-0 px-0' : ''}`}>
                    <div className={`text-xs text-gray-500 font-medium ${viewMode === 'list' ? 'hidden' : ''}`}>
                      ID: {staff.employee_id}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenStaffModal(staff)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff.id, staff.first_name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter the staff details below.</p>
              </div>
              <button
                onClick={() => setShowStaffModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="border-b border-gray-100 dark:border-gray-700 px-8 flex gap-8">
              {['personal', 'professional', 'contact'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 text-sm font-semibold border-b-2 transition-all capitalize
                      ${activeTab === tab
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {tab} Details
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name <span className="text-red-500">*</span></label>
                      <input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name <span className="text-red-500">*</span></label>
                      <input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="john@school.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
                      <select
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                      <input
                        name="employee_id"
                        value={formData.employee_id || '(Auto-generated)'}
                        readOnly
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        placeholder="Will be auto-generated"
                      />
                    </div>
                    <div className="space-y-2">
                      <NepaliDatePicker
                        label="Join Date"
                        value={formData.join_date}
                        onChange={(date: string) => setFormData(p => ({ ...p, join_date: date }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="on_leave">On Leave</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Qualification</label>
                      <select
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience (Years)</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Street Address</label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Zip Code</label>
                      <input
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-4">
              <button
                onClick={() => setShowStaffModal(false)}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaff}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform active:scale-95"
              >
                {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Departments</h2>
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-8">
              <div className="bg-blue-50 dark:bg-gray-700/50 p-6 rounded-xl mb-8 border border-blue-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {editingDepartmentId ? 'Edit Department' : 'Add New Department'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <input
                      placeholder="Department Name e.g. Science"
                      value={departmentForm.name}
                      onChange={e => setDepartmentForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <input
                      placeholder="Description"
                      value={departmentForm.description}
                      onChange={e => setDepartmentForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <input
                      placeholder="Head of Department"
                      value={departmentForm.head_of_department}
                      onChange={e => setDepartmentForm(p => ({ ...p, head_of_department: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveDepartment}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-medium text-sm transition-colors"
                    >
                      {editingDepartmentId ? 'Update' : 'Add Department'}
                    </button>
                    {editingDepartmentId && (
                      <button
                        onClick={() => {
                          setEditingDepartmentId(null)
                          setDepartmentForm({ id: '', name: '', description: '', head_of_department: '' })
                        }}
                        className="px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hovered:bg-gray-300 font-medium text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {departments.map(dept => (
                  <div key={dept.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-lg group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h4>
                      <div className="text-xs text-gray-500 flex gap-3 mt-1">
                        <span>Head: {dept.head_of_department || '-'}</span>
                        <span>•</span>
                        <span>{staffMembers.filter(s => s.department === dept.name).length} Staff</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingDepartmentId(dept.id)
                          setDepartmentForm({
                            id: dept.id,
                            name: dept.name,
                            description: dept.description,
                            head_of_department: dept.head_of_department
                          })
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
