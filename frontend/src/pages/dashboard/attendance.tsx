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

interface StudentAttendanceData {
  status: 'present' | 'absent' | 'leave'
  remarks: string
}

export default function AttendancePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // View mode toggle
  const [viewMode, setViewMode] = useState<'records' | 'mark'>('mark')

  // Bulk marking state
  const [selectedClass, setSelectedClass] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [studentAttendance, setStudentAttendance] = useState<Map<number, StudentAttendanceData>>(new Map())
  const [isSaving, setIsSaving] = useState(false)

  // Original modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [activeActionId, setActiveActionId] = useState<number | null>(null)
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

  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    student: true,
    class: true,
    date: true,
    status: true,
    remarks: true,
    actions: true,
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

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

  // Load students when class is selected in bulk marking mode
  useEffect(() => {
    if (selectedClass && viewMode === 'mark') {
      loadClassStudents()
    }
  }, [selectedClass, viewMode])

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

  const loadClassStudents = () => {
    const classStudents = students.filter(s => s.currentClass === selectedClass)

    // Initialize all students as present by default
    const newAttendance = new Map<number, StudentAttendanceData>()
    classStudents.forEach(student => {
      newAttendance.set(student.id, { status: 'present', remarks: '' })
    })
    setStudentAttendance(newAttendance)
  }

  const markAllPresent = () => {
    const updated = new Map(studentAttendance)
    updated.forEach((data, studentId) => {
      updated.set(studentId, { ...data, status: 'present' })
    })
    setStudentAttendance(updated)
    toast.success('All students marked as present')
  }

  const markAllAbsent = () => {
    const updated = new Map(studentAttendance)
    updated.forEach((data, studentId) => {
      updated.set(studentId, { ...data, status: 'absent' })
    })
    setStudentAttendance(updated)
    toast.success('All students marked as absent')
  }

  const toggleStudentStatus = (studentId: number, status: 'present' | 'absent' | 'leave') => {
    const updated = new Map(studentAttendance)
    const current = updated.get(studentId)
    if (current) {
      updated.set(studentId, { ...current, status })
    }
    setStudentAttendance(updated)
  }

  const updateStudentRemarks = (studentId: number, remarks: string) => {
    const updated = new Map(studentAttendance)
    const current = updated.get(studentId)
    if (current) {
      updated.set(studentId, { ...current, remarks })
    }
    setStudentAttendance(updated)
  }

  const submitBulkAttendance = async () => {
    if (!selectedClass || !attendanceDate) {
      toast.error('Please select class and date')
      return
    }

    if (studentAttendance.size === 0) {
      toast.error('No students to mark attendance for')
      return
    }

    setIsSaving(true)
    const toastId = toast.loading(`Saving attendance for ${studentAttendance.size} students...`)

    try {
      const attendanceRecords = Array.from(studentAttendance.entries()).map(([studentId, data]) => ({
        student_id: studentId,
        class: selectedClass,
        date: attendanceDate,
        status: data.status,
        remarks: data.remarks || ''
      }))

      // Submit all records
      await Promise.all(
        attendanceRecords.map(record => attendanceAPI.create(record))
      )

      toast.success(`Successfully saved attendance for ${attendanceRecords.length} students`, { id: toastId })

      // Refresh data and switch to records view
      await fetchData()
      setViewMode('records')
      setSelectedClass('')
      setStudentAttendance(new Map())
    } catch (error: any) {
      console.error('Failed to save bulk attendance:', error)
      toast.error('Failed to save attendance. Some records may have been saved.', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const studentMap = useMemo(() => {
    const map = new Map<number, Student>()
    students.forEach(s => map.set(s.id, s))
    return map
  }, [students])

  const classStudents = useMemo(() => {
    return students.filter(s => s.currentClass === selectedClass)
  }, [students, selectedClass])

  const attendanceStats = useMemo(() => {
    let present = 0, absent = 0, leave = 0
    studentAttendance.forEach(data => {
      if (data.status === 'present') present++
      else if (data.status === 'absent') absent++
      else if (data.status === 'leave') leave++
    })
    return { present, absent, leave, total: studentAttendance.size }
  }, [studentAttendance])

  // Original handlers
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
    setActiveActionId(null)
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
    setActiveActionId(null)
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

  // Statistics for records view
  const stats = useMemo(() => {
    const total = filteredRecords.length
    const present = filteredRecords.filter(r => r.status === 'present').length
    const absent = filteredRecords.filter(r => r.status === 'absent').length
    const leave = filteredRecords.filter(r => r.status === 'leave').length
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0'
    return { total, present, absent, leave, percentage }
  }, [filteredRecords])

  const markAllPresentOld = async () => {
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

        <main className="flex-1 py-8 px-6 pb-64 overflow-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Attendance Management
            </h1>
            <p className="text-gray-600">Track and manage student attendance records seamlessly</p>
          </div>

          {/* View Mode Toggle */}
          <div className="mb-6 flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-fit">
            <button
              onClick={() => setViewMode('mark')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${viewMode === 'mark'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              📝 Mark Attendance
            </button>
            <button
              onClick={() => setViewMode('records')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${viewMode === 'records'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              📊 View Records
            </button>
          </div>

          {/* Bulk Marking View */}
          {viewMode === 'mark' && (
            <div className="space-y-6">
              {/* Class and Date Selection */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Class & Date</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Class *</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <NepaliDatePicker
                    label="Date *"
                    value={attendanceDate}
                    onChange={setAttendanceDate}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Student List */}
              {selectedClass && classStudents.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Bulk Actions Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {selectedClass} - {classStudents.length} Students
                        </h2>
                        <p className="text-blue-100 text-sm">
                          {attendanceStats.present} Present • {attendanceStats.absent} Absent • {attendanceStats.leave} Leave
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={markAllPresent}
                          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <span>✓</span> Mark All Present
                        </button>
                        <button
                          onClick={markAllAbsent}
                          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <span>✗</span> Mark All Absent
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="p-6">
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {classStudents.map(student => {
                        const attendance = studentAttendance.get(student.id)
                        if (!attendance) return null

                        return (
                          <div
                            key={student.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${attendance.status === 'present'
                                ? 'bg-green-50 border-green-200 hover:border-green-300'
                                : attendance.status === 'absent'
                                  ? 'bg-red-50 border-red-200 hover:border-red-300'
                                  : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                              }`}
                          >
                            {/* Student Info */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                {student.firstName[0]}{student.lastName[0]}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {student.firstName} {student.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{student.studentId}</p>
                              </div>
                            </div>

                            {/* Status Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleStudentStatus(student.id, 'present')}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${attendance.status === 'present'
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                              >
                                ✓ Present
                              </button>
                              <button
                                onClick={() => toggleStudentStatus(student.id, 'absent')}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${attendance.status === 'absent'
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                              >
                                ✗ Absent
                              </button>
                              <button
                                onClick={() => toggleStudentStatus(student.id, 'leave')}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${attendance.status === 'leave'
                                    ? 'bg-yellow-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                              >
                                📅 Leave
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Submit Footer */}
                  <div className="bg-gray-50 p-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{attendanceStats.total}</span> students •
                        <span className="text-green-600 font-semibold ml-2">{attendanceStats.present} Present</span> •
                        <span className="text-red-600 font-semibold ml-2">{attendanceStats.absent} Absent</span> •
                        <span className="text-yellow-600 font-semibold ml-2">{attendanceStats.leave} Leave</span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedClass('')
                            setStudentAttendance(new Map())
                          }}
                          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitBulkAttendance}
                          disabled={isSaving}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <span>💾</span> Save Attendance
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedClass && classStudents.length === 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Found</h3>
                  <p className="text-gray-600">There are no students enrolled in {selectedClass}</p>
                </div>
              )}

              {!selectedClass && (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
                  <div className="text-6xl mb-4">👆</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Class to Begin</h3>
                  <p className="text-gray-600">Choose a class and date above to mark attendance</p>
                </div>
              )}
            </div>
          )}

          {/* Records View (Original) */}
          {viewMode === 'records' && (
            <>
              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Present</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-red-50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Absent</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Attendance %</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.percentage}%</p>
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
                      {filterClass && (
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold border border-blue-100">
                          <span className="opacity-60 capitalize">Class:</span> {filterClass}
                          <button onClick={() => setFilterClass('')} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                      {filterStatus && (
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold border border-blue-100">
                          <span className="opacity-60 capitalize">Status:</span> {filterStatus}
                          <button onClick={() => setFilterStatus('')} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Search by Student Name or ID..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
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
                                {classes.slice(0, 4).map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => setFilterClass(prev => (prev === c.name ? '' : c.name))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterClass === c.name ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} border`}
                                  >
                                    {c.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                              <div className="grid grid-cols-2 gap-2">
                                {['present', 'absent', 'leave'].map(st => (
                                  <button
                                    key={st}
                                    onClick={() => setFilterStatus(prev => (prev === st ? '' : st))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === st ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'} border`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Dates Section */}
                        <div className="border-l border-gray-100 pl-6 space-y-4">
                          <div className="flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-wider mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Select Date
                          </div>
                          <NepaliDatePicker
                            value={filterDate}
                            onChange={setFilterDate}
                            className="w-full"
                          />
                        </div>

                        {/* Group By Section */}
                        <div className="border-l border-gray-100 pl-6 space-y-4">
                          <div className="flex items-center gap-2 text-yellow-600 font-bold text-sm uppercase tracking-wider mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Group By
                          </div>
                          <div className="space-y-2">
                            {['Class', 'Status', 'Date'].map(group => (
                              <button
                                key={group}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 transition-all border border-transparent hover:border-yellow-100"
                              >
                                {group}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleAddNew}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>+</span> Record
                  </button>
                  <button
                    onClick={markAllPresentOld}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>✓</span> Mark All
                  </button>
                </div>
              </div>

              {/* Records Table */}
              <div className="bg-white rounded-2xl shadow-xl overflow-visible border border-gray-100">
                <div className="overflow-x-auto overflow-y-visible min-h-[400px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="relative z-20">
                      <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        {visibleColumns.student && <th className="px-6 py-4 font-semibold uppercase tracking-wider">Student</th>}
                        {visibleColumns.class && <th className="px-6 py-4 font-semibold uppercase tracking-wider">Class</th>}
                        {visibleColumns.date && <th className="px-6 py-4 font-semibold uppercase tracking-wider">Date</th>}
                        {visibleColumns.status && <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>}
                        {visibleColumns.remarks && <th className="px-6 py-4 font-semibold uppercase tracking-wider">Remarks</th>}
                        <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider relative">
                          <div className="flex items-center justify-end gap-2">
                            <span>Actions</span>
                            <div className="relative">
                              <button
                                onClick={() => setShowColumnPicker(!showColumnPicker)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 group active:scale-95"
                                title="Column Visibility"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>

                              {showColumnPicker && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)}></div>
                                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 py-3 animate-fade-in-up">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                      <h4 className="text-sm font-bold text-gray-900 text-left">Show/Hide Columns</h4>
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
                    <tbody className="divide-y divide-gray-50">
                      {isLoading ? (
                        <tr>
                          <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                              <p>Loading records...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredRecords.length > 0 ? (
                        filteredRecords.map(record => {
                          const student = studentMap.get(record.student_id)
                          return (
                            <tr key={record.id} className={`hover:bg-blue-50/30 transition-colors group ${activeActionId === record.id ? 'relative z-30' : ''}`}>
                              {visibleColumns.student && (
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-bold text-gray-900">
                                      {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium">{student?.studentId || 'ID N/A'}</p>
                                  </div>
                                </td>
                              )}
                              {visibleColumns.class && (
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                                    {record.class}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.date && (
                                <td className="px-6 py-4 text-gray-600 font-medium text-sm">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                              )}
                              {visibleColumns.status && (
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase ${record.status === 'present'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : record.status === 'absent'
                                      ? 'bg-red-100 text-red-700 border border-red-200'
                                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    }`}>
                                    {record.status}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.remarks && (
                                <td className="px-6 py-4 text-gray-600 text-sm italic">
                                  {record.remarks || '-'}
                                </td>
                              )}
                              <td className="px-6 py-4 text-right relative">
                                <div className="relative inline-block text-left">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActiveActionId(activeActionId === record.id ? null : record.id)
                                    }}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>

                                  {activeActionId === record.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setActiveActionId(null)}
                                      />
                                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEdit(record)
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <span>✏️</span> Edit
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(record.id)
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                          <span>🗑️</span> Delete
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-12 text-center text-gray-500">
                            No attendance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main >
      </div >

      {/* Add/Edit Modal */}
      {
        showModal && (
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
        )
      }
    </div >
  )
}
