import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'

interface Student {
  id: number
  firstName: string
  lastName: string
  currentClass: string
  [key: string]: any
}

interface FeeRecord {
  id: number
  student: string
  class: string
  amount: number
  status: 'Paid' | 'Pending' | 'Overdue'
  dueDate: string
  description?: string
}

const DEFAULT_FEE_RECORDS: FeeRecord[] = [
  { id: 1, student: 'John Doe', class: '10A', amount: 5000, status: 'Paid', dueDate: '2024-11-15', description: 'Monthly fees' },
  { id: 2, student: 'Jane Smith', class: '10B', amount: 5000, status: 'Pending', dueDate: '2024-11-10', description: 'Monthly fees' },
  { id: 3, student: 'Bob Johnson', class: '9A', amount: 5000, status: 'Overdue', dueDate: '2024-10-15', description: 'Monthly fees' },
]

const STATUS_OPTIONS = ['Paid', 'Pending', 'Overdue']

export default function FeesPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(DEFAULT_FEE_RECORDS)
  const [students, setStudents] = useState<Student[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null)

  const emptyFeeRecord: FeeRecord = {
    id: 0,
    student: '',
    class: '',
    amount: 0,
    status: 'Pending',
    dueDate: new Date().toISOString().split('T')[0],
    description: '',
  }

  const [formData, setFormData] = useState<FeeRecord>(emptyFeeRecord)

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
      // Load fee records
      const savedFees = localStorage.getItem('feeRecords')
      if (savedFees) {
        try {
          setFeeRecords(JSON.parse(savedFees))
        } catch (error) {
          console.error('Failed to load fee records:', error)
          setFeeRecords(DEFAULT_FEE_RECORDS)
        }
      }

      // Load students
      const savedStudents = localStorage.getItem('students')
      if (savedStudents) {
        try {
          setStudents(JSON.parse(savedStudents))
        } catch (error) {
          console.error('Failed to load students:', error)
          setStudents([])
        }
      }

      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('feeRecords', JSON.stringify(feeRecords))
    }
  }, [feeRecords, isHydrated])

  // Handle student selection with auto-population of class
  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentName = e.target.value
    setFormData((prev) => ({ ...prev, student: studentName }))

    // Find the student and auto-populate class
    if (studentName) {
      const selectedStudent = students.find(
        (s) => `${s.firstName} ${s.lastName}` === studentName
      )
      if (selectedStudent) {
        setFormData((prev) => ({ ...prev, class: selectedStudent.currentClass }))
      }
    } else {
      setFormData((prev) => ({ ...prev, class: '' }))
    }
  }

  const handleAddClick = () => {
    setFormData(emptyFeeRecord)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData(emptyFeeRecord)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.student || !formData.class || formData.amount <= 0) {
      alert('Please fill in all required fields with valid data')
      return
    }

    const newRecord = {
      ...formData,
      id: Math.max(...feeRecords.map((f) => f.id), 0) + 1,
    }
    setFeeRecords((prev) => [...prev, newRecord])
    handleCloseModal()
  }

  const handleEditClick = (record: FeeRecord) => {
    setEditingFeeId(record.id)
    setFormData(record)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingFeeId(null)
    setFormData(emptyFeeRecord)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingFeeId === null) return
    if (!formData.student || !formData.class || formData.amount <= 0) {
      alert('Please fill in all required fields with valid data')
      return
    }

    setFeeRecords((prev) =>
      prev.map((record) =>
        record.id === editingFeeId ? formData : record
      )
    )
    handleCloseEditModal()
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this fee record?')) {
      setFeeRecords((prev) => prev.filter((record) => record.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-4">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link href="/dashboard/accounting" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              ← Back to Accounting
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-8">Fee Management</h2>

          <button
            onClick={handleAddClick}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold">
            Add Fee Record
          </button>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Class</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Due Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feeRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.student}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.class}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{record.amount}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${record.status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.dueDate}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleEditClick(record)}
                        className="text-blue-600 hover:text-blue-700 mr-3 font-medium">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-700 font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Fee Record Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5 border-b-2 border-blue-200">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Add New Fee Record</h3>
                  <p className="text-sm text-gray-500 mt-1">Enter fee details for a student</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                      <select
                        value={formData.student}
                        onChange={handleStudentChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                          <option key={student.id} value={`${student.firstName} ${student.lastName}`}>
                            {student.firstName} {student.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                      <input
                        type="text"
                        name="class"
                        value={formData.class}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount || ''}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
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
                      Add Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Fee Record Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-5 border-b-2 border-purple-200">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Edit Fee Record</h3>
                  <p className="text-sm text-gray-500 mt-1">Update fee details</p>
                </div>

                <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                      <select
                        value={formData.student}
                        onChange={handleStudentChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                          <option key={student.id} value={`${student.firstName} ${student.lastName}`}>
                            {student.firstName} {student.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                      <input
                        type="text"
                        name="class"
                        value={formData.class}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount || ''}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
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
  )
}
