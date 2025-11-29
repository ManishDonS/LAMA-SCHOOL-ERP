import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import NepaliDatePicker from '@/components/NepaliDatePicker'

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  className: string
  date: string
  status: 'Present' | 'Absent' | 'Leave'
  remarks: string
  recordedBy: string
  recordedAt: string
}

interface AttendanceFormData {
  studentId: string
  studentName: string
  className: string
  date: string
  status: 'Present' | 'Absent' | 'Leave'
  remarks: string
}

const CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const DEFAULT_FORM_STATE: AttendanceFormData = {
  studentId: '',
  studentName: '',
  className: '',
  date: new Date().toISOString().split('T')[0],
  status: 'Present',
  remarks: '',
}

export default function AttendancePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [formData, setFormData] = useState<AttendanceFormData>(DEFAULT_FORM_STATE)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterClass, setFilterClass] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchStudent, setSearchStudent] = useState('')

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    }
  }, [user, router, isHydrated])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('attendanceRecords')
    if (saved) {
      try {
        setRecords(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load attendance records:', error)
      }
    }
  }, [])

  // Save to localStorage whenever records change
  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(records))
  }, [records])

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (!isHydrated || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/students', label: 'Students', icon: '👨‍🎓' },
    { href: '/dashboard/teachers', label: 'Teachers', icon: '👨‍🏫' },
    { href: '/dashboard/guardians', label: 'Guardians', icon: '👨‍👩‍👧' },
    { href: '/dashboard/staff', label: 'Staff', icon: '👔' },
    { href: '/dashboard/attendance', label: 'Attendance', icon: '📋', active: true },
    { href: '/dashboard/fees', label: 'Fees', icon: '💰' },
    { href: '/dashboard/library', label: 'Library', icon: '📚' },
    { href: '/dashboard/classes', label: 'Classes', icon: '🏫' },
    { href: '/dashboard/school-buses', label: 'School Buses', icon: '🚌' },
    { href: '/dashboard/exams', label: 'Exams', icon: '📝' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleAddNew = () => {
    setFormData(DEFAULT_FORM_STATE)
    setEditingId(null)
    setShowModal(true)
  }

  const handleEdit = (record: AttendanceRecord) => {
    setFormData({
      studentId: record.studentId,
      studentName: record.studentName,
      className: record.className,
      date: record.date,
      status: record.status,
      remarks: record.remarks,
    })
    setEditingId(record.id)
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      setRecords(records.filter(r => r.id !== id))
    }
  }

  const handleSave = () => {
    if (!formData.studentId || !formData.studentName || !formData.className || !formData.date) {
      alert('Please fill in all required fields')
      return
    }

    const now = new Date().toISOString()
    const user = localStorage.getItem('loginUser') || 'System'

    if (editingId) {
      setRecords(records.map(r =>
        r.id === editingId
          ? {
            ...formData,
            id: r.id,
            recordedBy: user,
            recordedAt: r.recordedAt,
          }
          : r
      ))
    } else {
      const newRecord: AttendanceRecord = {
        id: `ATT-${Date.now()}`,
        ...formData,
        recordedBy: user,
        recordedAt: now,
      }
      setRecords([newRecord, ...records])
    }

    setShowModal(false)
    setFormData(DEFAULT_FORM_STATE)
  }

  const getFilteredRecords = () => {
    return records.filter(record => {
      const matchClass = !filterClass || record.className === filterClass
      const matchDate = !filterDate || record.date === filterDate
      const matchStatus = !filterStatus || record.status === filterStatus
      const matchStudent = !searchStudent ||
        record.studentName.toLowerCase().includes(searchStudent.toLowerCase()) ||
        record.studentId.toLowerCase().includes(searchStudent.toLowerCase())

      return matchClass && matchDate && matchStatus && matchStudent
    })
  }

  const filteredRecords = getFilteredRecords()

  // Calculate statistics
  const totalRecords = filteredRecords.length
  const presentCount = filteredRecords.filter(r => r.status === 'Present').length
  const absentCount = filteredRecords.filter(r => r.status === 'Absent').length
  const leaveCount = filteredRecords.filter(r => r.status === 'Leave').length
  const presentagePercentage = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : '0.00'

  // Mark all present for a date
  const markAllPresent = () => {
    if (!filterDate) {
      alert('Please select a date first')
      return
    }

    const today = filterDate
    const studentsToMark = CLASSES.flatMap((className, idx) => {
      const count = idx + 1
      return Array.from({ length: count }, (_, i) => ({
        studentId: `STU${1000 + idx * 100 + i}`,
        studentName: `Student ${idx + 1}-${i + 1}`,
        className,
      }))
    })

    const user = localStorage.getItem('loginUser') || 'System'
    const now = new Date().toISOString()

    const newRecords = studentsToMark
      .filter(s => !records.some(r => r.date === today && r.studentId === s.studentId))
      .map(s => ({
        id: `ATT-${Date.now()}-${Math.random()}`,
        studentId: s.studentId,
        studentName: s.studentName,
        className: s.className,
        date: today,
        status: 'Present' as const,
        remarks: '',
        recordedBy: user,
        recordedAt: now,
      }))

    setRecords([...records, ...newRecords])
    alert(`Marked ${newRecords.length} students as present for ${today}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Attendance Management</h1>
            <p className="text-gray-600">Track and manage student attendance records</p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <p className="text-gray-600 text-sm font-medium">Total Records</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalRecords}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <p className="text-gray-600 text-sm font-medium">Present</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{presentCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <p className="text-gray-600 text-sm font-medium">Absent</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{absentCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <p className="text-gray-600 text-sm font-medium">Leave</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{leaveCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <p className="text-gray-600 text-sm font-medium">Present %</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{presentagePercentage}%</p>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search by name or ID"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <NepaliDatePicker
                value={filterDate}
                onChange={setFilterDate}
                className="w-full"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
              <button
                onClick={() => {
                  setSearchStudent('')
                  setFilterClass('')
                  setFilterDate('')
                  setFilterStatus('')
                }}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={markAllPresent}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg text-white rounded-lg font-semibold transition-all duration-200"
            >
              Mark All Present
            </button>
            <button
              onClick={handleAddNew}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white rounded-lg font-semibold transition-all duration-200"
            >
              + Add Record
            </button>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Remarks</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{record.studentName}</p>
                          <p className="text-sm text-gray-600">{record.studentId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{record.className}</td>
                      <td className="px-6 py-4 text-gray-900">{record.date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${record.status === 'Present'
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'Absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{record.remarks || '-'}</td>
                      <td className="px-6 py-4 space-x-2 flex">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-900 font-semibold transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-900 font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Attendance Record' : 'Add Attendance Record'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Student ID *</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., STU001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Class *</label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <NepaliDatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(date: string) => setFormData({ ...formData, date })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Present' | 'Absent' | 'Leave' })}
                  className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any remarks (optional)"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg text-white rounded-lg font-semibold transition-all"
              >
                {editingId ? 'Update' : 'Add'} Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
