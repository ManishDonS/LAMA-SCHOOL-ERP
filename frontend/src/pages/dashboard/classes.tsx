import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'

interface ClassRoom {
  id: string
  className: string
  classGrade: string
  section: string
  capacity: number
  totalStudents: number
  classTeacher: string
  status: 'Active' | 'Inactive'
  room: string
  shift: 'Morning' | 'Afternoon' | 'Evening'
  academicYear: string
  description: string
}

interface ClassSchedule {
  id: string
  classId: string
  className: string
  dayOfWeek: string
  subject: string
  teacher: string
  startTime: string
  endTime: string
  room: string
}

interface ClassAssignment {
  id: string
  classId: string
  className: string
  studentId: string
  studentName: string
  rollNumber: string
  assignmentDate: string
  status: 'Active' | 'Inactive'
}

interface FormData {
  className: string
  classGrade: string
  section: string
  capacity: number
  classTeacher: string
  status: 'Active' | 'Inactive'
  room: string
  shift: 'Morning' | 'Afternoon' | 'Evening'
  academicYear: string
  description: string
}

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SECTIONS = ['A', 'B', 'C', 'D', 'E']
const SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Hindi',
  'Physical Education',
  'Computer Science',
  'Art',
  'Music',
  'History',
  'Geography',
]
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

const DEFAULT_FORM_STATE: FormData = {
  className: '',
  classGrade: '1',
  section: 'A',
  capacity: 40,
  classTeacher: '',
  status: 'Active',
  room: '',
  shift: 'Morning',
  academicYear: '2024-2025',
  description: '',
}

export default function ClassesPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [assignments, setAssignments] = useState<ClassAssignment[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<'classes' | 'schedule' | 'assignments' | 'stats'>('classes')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)
  const [academicYears, setAcademicYears] = useState<any[]>([])

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
      const savedClasses = localStorage.getItem('classes')
      const savedSchedules = localStorage.getItem('classSchedules')
      const savedAssignments = localStorage.getItem('classAssignments')
      const savedAcademicYears = localStorage.getItem('academicYears')

      if (savedClasses) {
        try {
          setClasses(JSON.parse(savedClasses))
        } catch (error) {
          console.error('Failed to load classes:', error)
          setDefaultData()
        }
      } else {
        setDefaultData()
      }

      if (savedSchedules) {
        try {
          setSchedules(JSON.parse(savedSchedules))
        } catch (error) {
          console.error('Failed to load schedules:', error)
        }
      }

      if (savedAssignments) {
        try {
          setAssignments(JSON.parse(savedAssignments))
        } catch (error) {
          console.error('Failed to load assignments:', error)
        }
      }

      if (savedAcademicYears) {
        try {
          setAcademicYears(JSON.parse(savedAcademicYears))
        } catch (error) {
          console.error('Failed to load academic years:', error)
        }
      }

      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('classes', JSON.stringify(classes))
      localStorage.setItem('classSchedules', JSON.stringify(schedules))
      localStorage.setItem('classAssignments', JSON.stringify(assignments))
    }
  }, [classes, schedules, assignments, isHydrated])

  const setDefaultData = () => {
    const defaultClasses: ClassRoom[] = [
      {
        id: '1',
        className: 'Class 10-A',
        classGrade: '10',
        section: 'A',
        capacity: 45,
        totalStudents: 42,
        classTeacher: 'Rajesh Kumar',
        status: 'Active',
        room: '101',
        shift: 'Morning',
        academicYear: '2024-2025',
        description: 'Science stream class',
      },
      {
        id: '2',
        className: 'Class 9-B',
        classGrade: '9',
        section: 'B',
        capacity: 40,
        totalStudents: 38,
        classTeacher: 'Priya Singh',
        status: 'Active',
        room: '102',
        shift: 'Morning',
        academicYear: '2024-2025',
        description: 'Commerce stream class',
      },
      {
        id: '3',
        className: 'Class 8-C',
        classGrade: '8',
        section: 'C',
        capacity: 45,
        totalStudents: 40,
        classTeacher: 'Amit Patel',
        status: 'Active',
        room: '103',
        shift: 'Afternoon',
        academicYear: '2024-2025',
        description: 'General stream class',
      },
    ]
    setClasses(defaultClasses)

    const defaultSchedules: ClassSchedule[] = [
      {
        id: '1',
        classId: '1',
        className: 'Class 10-A',
        dayOfWeek: 'Monday',
        subject: 'Mathematics',
        teacher: 'Rajesh Kumar',
        startTime: '09:00',
        endTime: '10:00',
        room: '101',
      },
      {
        id: '2',
        classId: '1',
        className: 'Class 10-A',
        dayOfWeek: 'Monday',
        subject: 'English',
        teacher: 'Priya Singh',
        startTime: '10:00',
        endTime: '11:00',
        room: '101',
      },
    ]
    setSchedules(defaultSchedules)
  }

  const handleAddClass = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setShowModal(true)
  }

  const handleEditClass = (classRoom: ClassRoom) => {
    setEditingId(classRoom.id)
    setFormData({
      className: classRoom.className,
      classGrade: classRoom.classGrade,
      section: classRoom.section,
      capacity: classRoom.capacity,
      classTeacher: classRoom.classTeacher,
      status: classRoom.status,
      room: classRoom.room,
      shift: classRoom.shift,
      academicYear: classRoom.academicYear,
      description: classRoom.description,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData(DEFAULT_FORM_STATE)
    setEditingId(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value,
    }))
  }

  const validateForm = () => {
    if (!formData.className.trim()) {
      alert('Please enter class name')
      return false
    }
    if (!formData.classTeacher.trim()) {
      alert('Please enter class teacher')
      return false
    }
    if (formData.capacity <= 0) {
      alert('Capacity must be greater than 0')
      return false
    }
    return true
  }

  const handleSaveClass = () => {
    if (!validateForm()) return

    if (editingId) {
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === editingId
            ? {
              ...cls,
              className: formData.className,
              classGrade: formData.classGrade,
              section: formData.section,
              capacity: formData.capacity,
              classTeacher: formData.classTeacher,
              status: formData.status,
              room: formData.room,
              shift: formData.shift,
              academicYear: formData.academicYear,
              description: formData.description,
            }
            : cls
        )
      )
    } else {
      const newClass: ClassRoom = {
        id: Date.now().toString(),
        className: formData.className,
        classGrade: formData.classGrade,
        section: formData.section,
        capacity: formData.capacity,
        totalStudents: 0,
        classTeacher: formData.classTeacher,
        status: formData.status,
        room: formData.room,
        shift: formData.shift,
        academicYear: formData.academicYear,
        description: formData.description,
      }
      setClasses((prev) => [newClass, ...prev])
    }

    handleCloseModal()
  }

  const handleDeleteClass = (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      setClasses((prev) => prev.filter((cls) => cls.id !== id))
      setSchedules((prev) => prev.filter((sch) => sch.classId !== id))
      setAssignments((prev) => prev.filter((asn) => asn.classId !== id))
    }
  }

  const handleAddSchedule = () => {
    const classId = prompt('Enter Class ID:')
    const day = prompt('Enter Day (Monday-Saturday):')
    const subject = prompt('Enter Subject:')
    const teacher = prompt('Enter Teacher Name:')
    const startTime = prompt('Enter Start Time (HH:MM):')
    const endTime = prompt('Enter End Time (HH:MM):')
    const room = prompt('Enter Room Number:')

    if (classId && day && subject && teacher && startTime && endTime && room) {
      const selectedClass = classes.find((c) => c.id === classId)
      if (!selectedClass) {
        alert('Class not found')
        return
      }

      const newSchedule: ClassSchedule = {
        id: Date.now().toString(),
        classId,
        className: selectedClass.className,
        dayOfWeek: day,
        subject,
        teacher,
        startTime,
        endTime,
        room,
      }

      setSchedules((prev) => [newSchedule, ...prev])
      alert('Schedule added successfully')
    }
  }

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Delete this schedule?')) {
      setSchedules((prev) => prev.filter((sch) => sch.id !== id))
    }
  }

  const handleAddAssignment = () => {
    const classId = prompt('Enter Class ID:')
    const studentId = prompt('Enter Student ID:')
    const studentName = prompt('Enter Student Name:')
    const rollNumber = prompt('Enter Roll Number:')

    if (classId && studentId && studentName && rollNumber) {
      const selectedClass = classes.find((c) => c.id === classId)
      if (!selectedClass) {
        alert('Class not found')
        return
      }

      if (selectedClass.totalStudents >= selectedClass.capacity) {
        alert('Class is at full capacity')
        return
      }

      const newAssignment: ClassAssignment = {
        id: Date.now().toString(),
        classId,
        className: selectedClass.className,
        studentId,
        studentName,
        rollNumber,
        assignmentDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      }

      setAssignments((prev) => [newAssignment, ...prev])
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId
            ? {
              ...c,
              totalStudents: c.totalStudents + 1,
            }
            : c
        )
      )
      alert(`Student assigned to ${selectedClass.className}`)
    }
  }

  const handleRemoveAssignment = (id: string) => {
    const assignment = assignments.find((a) => a.id === id)
    if (!assignment) return

    if (confirm('Remove student from class?')) {
      setAssignments((prev) => prev.filter((a) => a.id !== id))
      setClasses((prev) =>
        prev.map((c) =>
          c.id === assignment.classId
            ? {
              ...c,
              totalStudents: Math.max(0, c.totalStudents - 1),
            }
            : c
        )
      )
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'Morning':
        return 'bg-blue-100 text-blue-800'
      case 'Afternoon':
        return 'bg-orange-100 text-orange-800'
      case 'Evening':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalClasses = classes.length
  const activeClasses = classes.filter((c) => c.status === 'Active').length
  const totalStudents = classes.reduce((sum, c) => sum + c.totalStudents, 0)
  const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Class Management</h2>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`flex-1 py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'classes'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  🏫 Classes ({classes.length})
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex-1 py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'schedule'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  📅 Schedule ({schedules.length})
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`flex-1 py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'assignments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  👥 Assignments ({assignments.length})
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'stats'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  📊 Statistics
                </button>
              </div>
            </div>
          </div>

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Class Management</h3>
                <button
                  onClick={handleAddClass}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                >
                  + Add New Class
                </button>
              </div>

              {classes.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500 text-lg">No classes created yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {classes.map((classRoom) => (
                    <div key={classRoom.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{classRoom.className}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(classRoom.status)}`}>
                              {classRoom.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getShiftColor(classRoom.shift)}`}>
                              {classRoom.shift}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            <span className="font-semibold">Class Teacher:</span> {classRoom.classTeacher}
                          </p>
                          <div className="grid grid-cols-5 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-gray-500">Grade</p>
                              <p className="font-semibold text-gray-900">{classRoom.classGrade}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Section</p>
                              <p className="font-semibold text-gray-900">{classRoom.section}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Room</p>
                              <p className="font-semibold text-gray-900">{classRoom.room}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Students</p>
                              <p className="font-semibold text-blue-600">
                                {classRoom.totalStudents}/{classRoom.capacity}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Year</p>
                              <p className="font-semibold text-gray-900">{classRoom.academicYear}</p>
                            </div>
                          </div>
                          {classRoom.description && <p className="text-gray-600 mt-3">{classRoom.description}</p>}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditClass(classRoom)}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClass(classRoom.id)}
                            className="text-red-600 hover:text-red-800 font-semibold hover:underline"
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
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Class Schedule</h3>
                <button
                  onClick={handleAddSchedule}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                >
                  + Add Schedule
                </button>
              </div>

              {schedules.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500 text-lg">No schedules created yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{schedule.className}</h3>
                          <div className="grid grid-cols-5 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Day</p>
                              <p className="font-semibold text-gray-900">{schedule.dayOfWeek}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Subject</p>
                              <p className="font-semibold text-gray-900">{schedule.subject}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Teacher</p>
                              <p className="font-semibold text-gray-900">{schedule.teacher}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Time</p>
                              <p className="font-semibold text-gray-900">
                                {schedule.startTime} - {schedule.endTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Room</p>
                              <p className="font-semibold text-gray-900">{schedule.room}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-800 font-semibold hover:underline ml-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Student Assignments</h3>
                <button
                  onClick={handleAddAssignment}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
                >
                  + Assign Student
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500 text-lg">No student assignments yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.className}</h3>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Student Name</p>
                              <p className="font-semibold text-gray-900">{assignment.studentName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Student ID</p>
                              <p className="font-semibold text-gray-900">{assignment.studentId}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Roll Number</p>
                              <p className="font-semibold text-gray-900">{assignment.rollNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Assigned Date</p>
                              <p className="font-semibold text-gray-900">📅 {assignment.assignmentDate}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-800 font-semibold hover:underline ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Class Statistics</h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-gray-600 text-sm font-medium">Total Classes</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{totalClasses}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-gray-600 text-sm font-medium">Active Classes</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{activeClasses}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-gray-600 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{totalStudents}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-gray-600 text-sm font-medium">Total Capacity</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{totalCapacity}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-gray-600 text-sm font-medium">Avg Class Size</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">
                    {totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0}
                  </p>
                </div>
              </div>

              {/* Occupancy Overview */}
              <div className="mt-8">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Class Occupancy</h4>
                <div className="space-y-3">
                  {classes.map((classRoom) => {
                    const occupancyPercent = Math.round((classRoom.totalStudents / classRoom.capacity) * 100)
                    return (
                      <div key={classRoom.id} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{classRoom.className}</span>
                          <span className="text-sm font-semibold text-gray-600">
                            {classRoom.totalStudents}/{classRoom.capacity} ({occupancyPercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${occupancyPercent > 90
                                ? 'bg-red-600'
                                : occupancyPercent > 70
                                  ? 'bg-orange-600'
                                  : 'bg-green-600'
                              }`}
                            style={{ width: `${occupancyPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Class' : 'Add New Class'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Name *</label>
                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Class 10-A"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  <select
                    name="classGrade"
                    value={formData.classGrade}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {GRADES.map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Teacher *</label>
                  <input
                    type="text"
                    name="classTeacher"
                    value={formData.classTeacher}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter teacher name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Academic Year --</option>
                    {academicYears.map((year: any) => (
                      <option key={year.id} value={year.academicYear}>
                        {year.academicYear}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter class description"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-8 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClass}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                {editingId ? 'Update Class' : 'Add Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
