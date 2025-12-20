import { useRouter } from 'next/router'
import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { attendanceAPI, studentAPI, classAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

interface AttendanceRecord {
  id: number
  student_id: number
  class: string
  date: string
  status: 'present' | 'absent' | 'leave'
  remarks: string
  marked_by?: number
  created_at: string
  updated_at: string
}

interface Student {
  id: number
  firstName: string
  lastName: string
  studentId: string
  currentClass: string
}

interface Class {
  id: number
  name: string
  grade: string
  section: string
}

export default function AttendancePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    student_id: 0,
    class: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present' as 'present' | 'absent' | 'leave',
    remarks: '',
  })

  // Filters
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

  useEffect(() => {
    if (isHydrated && user) {
      fetchData()
    }
  }, [isHydrated, user])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [studentsRes, attendanceRes, classesRes] = await Promise.all([
        studentAPI.list(),
        attendanceAPI.list(),
        classAPI.list()
      ])

      const mappedStudents = (studentsRes.data.students || []).map((s: any) => ({
        id: Number(s.id),
        firstName: s.first_name,
        lastName: s.last_name,
        studentId: s.student_id_number,
        currentClass: s.class,
      }))

      setStudents(mappedStudents)
      setRecords(attendanceRes.data.records || [])
      setClasses(classesRes.data.classes || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load records')
    } finally {
      setIsLoading(false)
    }
  }

  const studentMap = useMemo(() => {
    const map = new Map<number, Student>()
    students.forEach(s => map.set(s.id, s))
    return map
  }, [students])

  const handleAddNew = () => {
    setFormData({
      student_id: 0,
      class: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      remarks: '',
    })
    setEditingId(null)
    setShowModal(true)
  }

  const handleEdit = (record: AttendanceRecord) => {
    setFormData({
      student_id: record.student_id,
      class: record.class,
      date: record.date.split('T')[0],
      status: record.status,
      remarks: record.remarks,
    })
    setEditingId(record.id)
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await attendanceAPI.delete(id.toString())
        toast.success('Record deleted')
        setRecords(records.filter(r => r.id !== id))
      } catch (error) {
        toast.error('Failed to delete record')
      }
    }
  }

  const handleSave = async () => {
    if (!formData.student_id || !formData.class || !formData.date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingId) {
        await attendanceAPI.update(editingId.toString(), formData)
        toast.success('Record updated')
      } else {
        await attendanceAPI.create(formData)
        toast.success('Record added')
      }
      fetchData()
      setShowModal(false)
    } catch (error) {
      toast.error('Failed to save record')
    }
  }

  const filteredRecords = records.filter(record => {
    const student = studentMap.get(record.student_id)
    const studentName = student ? `${student.firstName} ${student.lastName}` : ''
    const studentIdStr = student ? student.studentId : ''

    const matchClass = !filterClass || record.class === filterClass
    const matchDate = !filterDate || record.date.startsWith(filterDate)
    const matchStatus = !filterStatus || record.status === filterStatus
    const matchStudent = !searchStudent ||
      studentName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      studentIdStr.toLowerCase().includes(searchStudent.toLowerCase())

    return matchClass && matchDate && matchStatus && matchStudent
  })

  // Statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length
    const present = filteredRecords.filter(r => r.status === 'present').length
    const absent = filteredRecords.filter(r => r.status === 'absent').length
    const leave = filteredRecords.filter(r => r.status === 'leave').length
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0'
    return { total, present, absent, leave, percentage }
  }, [filteredRecords])

  const markAllPresent = async () => {
    if (!filterDate || !filterClass) {
      toast.error('Please select both Date and Class to mark all present')
      return
    }

    const studentsInClass = students.filter(s => s.currentClass === filterClass)
    if (studentsInClass.length === 0) {
      toast.error(`No students found in ${filterClass}`)
      return
    }

    const existingAttendance = records.filter(r =>
      r.class === filterClass &&
      r.date.startsWith(filterDate)
    )

    const studentsToMark = studentsInClass.filter(s =>
      !existingAttendance.some(r => r.student_id === s.id)
    )

    if (studentsToMark.length === 0) {
      toast.success('All students in this class are already marked for this date')
      return
    }

    toast.loading(`Marking ${studentsToMark.length} students as present...`, { id: 'bulk-mark' })

    try {
      await Promise.all(studentsToMark.map(s =>
        attendanceAPI.create({
          student_id: s.id,
          class: s.currentClass,
          date: filterDate,
          status: 'present',
          remarks: 'Bulk marked'
        })
      ))
      toast.success(`Successfully marked ${studentsToMark.length} students`, { id: 'bulk-mark' })
      fetchData()
    } catch (error) {
      toast.error('Failed to complete bulk attendance', { id: 'bulk-mark' })
    }
  }

  if (!isHydrated || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Attendance Management
            </h1>
            <p className="text-gray-600">Track and manage student attendance records seamlessly</p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Records', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
              { label: 'Present', value: stats.present, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Absent', value: stats.absent, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Leave', value: stats.leave, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Present %', value: `${stats.percentage}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all duration-200`}>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters Section */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔍</span>
              <h3 className="text-lg font-semibold text-gray-900">Search & Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Student Name or ID"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
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
                className="px-4 py-2 border border-gray-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
              <button
                onClick={() => {
                  setSearchStudent('')
                  setFilterClass('')
                  setFilterDate('')
                  setFilterStatus('')
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddNew}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <span>+</span> Add New Record
            </button>
            <button
              onClick={markAllPresent}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <span>✓</span> Mark All Present
            </button>
          </div>

          {/* Records Table */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-600 text-sm font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Remarks</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading records...</td></tr>
                  ) : filteredRecords.length > 0 ? (
                    filteredRecords.map(record => {
                      const student = studentMap.get(record.student_id)
                      return (
                        <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-gray-900">
                                {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                              </p>
                              <p className="text-xs text-gray-500 font-medium">{student?.studentId || 'ID N/A'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                              {record.class}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-medium">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${record.status === 'present'
                              ? 'bg-green-100 text-green-700'
                              : record.status === 'absent'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm italic">
                            {record.remarks || '-'}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? 'Edit Attendance Record' : 'New Attendance Record'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 transition-colors">
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Student *</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => {
                      const sid = parseInt(e.target.value)
                      const student = studentMap.get(sid)
                      setFormData({ ...formData, student_id: sid, class: student?.currentClass || '' })
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value={0}>Select Student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Class *</label>
                    <input
                      type="text"
                      value={formData.class}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <NepaliDatePicker
                    label="Date *"
                    value={formData.date}
                    onChange={(date: string) => setFormData({ ...formData, date })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['present', 'absent', 'leave'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: opt as any })}
                        className={`px-4 py-2 rounded-xl font-bold text-sm uppercase transition-all duration-200 ${formData.status === opt
                          ? opt === 'present' ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                            : opt === 'absent' ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                              : 'bg-yellow-500 text-white shadow-lg shadow-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white rounded-xl font-bold transition-all shadow-blue-200"
                >
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

