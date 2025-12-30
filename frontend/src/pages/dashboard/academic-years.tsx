import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { classAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'Active' | 'Inactive'
  description: string
  is_current: boolean
  created_at: string
}

interface FormData {
  name: string
  start_date: string
  end_date: string
  status: 'Active' | 'Inactive'
  description: string
  is_current: boolean
}

const DEFAULT_FORM_STATE: FormData = {
  name: '',
  start_date: '',
  end_date: '',
  status: 'Active',
  description: '',
  is_current: false,
}


export default function AcademicYearsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
    { href: '/dashboard/academic-years', label: 'Academic Years', icon: '📅' },
    { href: '/dashboard/exams', label: 'Exams', icon: '📝' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
  ]

  const fetchAcademicYears = async () => {
    try {
      const response = await classAPI.listAY()
      if (response.data && response.data.data) {
        setAcademicYears(response.data.data)
      }
    } catch (error: any) {
      console.error('Failed to fetch academic years:', error)
      toast.error(error.response?.data?.error || 'Failed to load academic years')
    }
  }

  useEffect(() => {
    if (user) {
      fetchAcademicYears()
    }
    setIsHydrated(true)
  }, [user])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    }
  }, [user, router, isHydrated])

  const handleAddNew = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setShowModal(true)
  }

  const handleEdit = (item: AcademicYear) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      start_date: item.start_date,
      end_date: item.end_date,
      status: item.status,
      description: item.description,
      is_current: item.is_current,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate date format
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)

    if (startDate >= endDate) {
      toast.error('Start date must be before end date')
      return
    }

    try {
      if (editingId) {
        await classAPI.updateAY(editingId, formData)
        toast.success('Academic year updated successfully')
      } else {
        await classAPI.createAY(formData)
        toast.success('Academic year created successfully')
      }
      fetchAcademicYears()
      setShowModal(false)
      setFormData(DEFAULT_FORM_STATE)
    } catch (error: any) {
      console.error('Failed to save academic year:', error)
      toast.error(error.response?.data?.error || 'Failed to save academic year')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this academic year?')) {
      try {
        await classAPI.deleteAY(id)
        toast.success('Academic year deleted successfully')
        fetchAcademicYears()
      } catch (error: any) {
        console.error('Failed to delete academic year:', error)
        toast.error(error.response?.data?.error || 'Failed to delete academic year')
      }
    }
  }

  const handleActivate = async (id: string) => {
    try {
      const ay = academicYears.find(a => a.id === id)
      if (ay) {
        await classAPI.updateAY(id, { ...ay, is_current: true, status: 'Active' })
        toast.success('Academic year activated successfully')
        fetchAcademicYears()
      }
    } catch (error: any) {
      console.error('Failed to activate academic year:', error)
      toast.error(error.response?.data?.error || 'Failed to activate academic year')
    }
  }

  const filteredYears = academicYears.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeYears = academicYears.filter((item) => item.status === 'Active').length
  const totalYears = academicYears.length
  const currentYear = academicYears.find((item) => item.is_current)

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
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Academic Years Management</h2>
            <p className="text-gray-600 mb-6">Manage academic years for the school</p>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-medium">Total Academic Years</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalYears}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-medium">Active Years</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeYears}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-medium">Current Year</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">{currentYear?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search academic years..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddNew}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition-all duration-200 hover:shadow-lg"
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
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.start_date}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.end_date}</td>
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
                                onClick={() => handleEdit(item)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold transition"
                              >
                                Edit
                              </button>
                              {!item.is_current && (
                                <button
                                  onClick={() => handleActivate(item.id)}
                                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs font-semibold transition"
                                >
                                  Set Current
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(item.id)}
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
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Academic Year' : 'Add New Academic Year'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <NepaliDatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={(date: string) => setFormData({ ...formData, start_date: date })}
                  required
                />
              </div>

              <div>
                <NepaliDatePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={(date: string) => setFormData({ ...formData, end_date: date })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
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
