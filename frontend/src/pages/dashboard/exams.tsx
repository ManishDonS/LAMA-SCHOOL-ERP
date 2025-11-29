import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import NepaliDatePicker from '@/components/NepaliDatePicker'

interface Exam {
  id: string
  name: string
  date: string
  class: string
  totalMarks: number
  passingMarks: number
  duration: number
  subject: string
  examType: 'Unit Test' | 'Mid Term' | 'Final' | 'Practical'
  description: string
}

interface FormData {
  name: string
  date: string
  class: string
  totalMarks: number
  passingMarks: number
  duration: number
  subject: string
  examType: 'Unit Test' | 'Mid Term' | 'Final' | 'Practical'
  description: string
}

const EXAM_TYPES = ['Unit Test', 'Mid Term', 'Final', 'Practical'] as const
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
  'Chemistry',
]

const CLASSES = [
  '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B',
  '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B',
]

const DEFAULT_FORM_STATE: FormData = {
  name: '',
  date: '',
  class: '',
  totalMarks: 100,
  passingMarks: 40,
  duration: 60,
  subject: 'Mathematics',
  examType: 'Final',
  description: '',
}

export default function ExamsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)

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
      const savedExams = localStorage.getItem('exams')
      if (savedExams) {
        try {
          setExams(JSON.parse(savedExams))
        } catch (error) {
          console.error('Failed to load exams:', error)
          const defaultExams: Exam[] = [
            {
              id: '1',
              name: 'Mathematics Final',
              date: '2024-11-20',
              class: '10A',
              totalMarks: 100,
              passingMarks: 40,
              duration: 120,
              subject: 'Mathematics',
              examType: 'Final',
              description: 'Final examination for Mathematics',
            },
            {
              id: '2',
              name: 'English Final',
              date: '2024-11-22',
              class: '10A',
              totalMarks: 100,
              passingMarks: 40,
              duration: 120,
              subject: 'English',
              examType: 'Final',
              description: 'Final examination for English',
            },
            {
              id: '3',
              name: 'Science Final',
              date: '2024-11-25',
              class: '10B',
              totalMarks: 100,
              passingMarks: 40,
              duration: 120,
              subject: 'Science',
              examType: 'Final',
              description: 'Final examination for Science',
            },
          ]
          setExams(defaultExams)
        }
      } else {
        const defaultExams: Exam[] = [
          {
            id: '1',
            name: 'Mathematics Final',
            date: '2024-11-20',
            class: '10A',
            totalMarks: 100,
            passingMarks: 40,
            duration: 120,
            subject: 'Mathematics',
            examType: 'Final',
            description: 'Final examination for Mathematics',
          },
          {
            id: '2',
            name: 'English Final',
            date: '2024-11-22',
            class: '10A',
            totalMarks: 100,
            passingMarks: 40,
            duration: 120,
            subject: 'English',
            examType: 'Final',
            description: 'Final examination for English',
          },
          {
            id: '3',
            name: 'Science Final',
            date: '2024-11-25',
            class: '10B',
            totalMarks: 100,
            passingMarks: 40,
            duration: 120,
            subject: 'Science',
            examType: 'Final',
            description: 'Final examination for Science',
          },
        ]
        setExams(defaultExams)
      }
      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('exams', JSON.stringify(exams))
    }
  }, [exams, isHydrated])

  const handleAddExam = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setShowModal(true)
  }

  const handleEditExam = (exam: Exam) => {
    setEditingId(exam.id)
    setFormData({
      name: exam.name,
      date: exam.date,
      class: exam.class,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      duration: exam.duration,
      subject: exam.subject,
      examType: exam.examType,
      description: exam.description,
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
      [name]: name === 'totalMarks' || name === 'passingMarks' || name === 'duration' ? parseInt(value) || 0 : value,
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Please enter exam name')
      return false
    }
    if (!formData.date) {
      alert('Please select exam date')
      return false
    }
    if (!formData.class) {
      alert('Please select class')
      return false
    }
    if (formData.totalMarks <= 0) {
      alert('Total marks must be greater than 0')
      return false
    }
    if (formData.passingMarks > formData.totalMarks) {
      alert('Passing marks cannot be greater than total marks')
      return false
    }
    if (formData.duration <= 0) {
      alert('Duration must be greater than 0')
      return false
    }
    return true
  }

  const handleSaveExam = () => {
    if (!validateForm()) return

    if (editingId) {
      // Update existing exam
      setExams((prev) =>
        prev.map((exam) =>
          exam.id === editingId
            ? {
              ...exam,
              name: formData.name,
              date: formData.date,
              class: formData.class,
              totalMarks: formData.totalMarks,
              passingMarks: formData.passingMarks,
              duration: formData.duration,
              subject: formData.subject,
              examType: formData.examType,
              description: formData.description,
            }
            : exam
        )
      )
    } else {
      // Add new exam
      const newExam: Exam = {
        id: Date.now().toString(),
        name: formData.name,
        date: formData.date,
        class: formData.class,
        totalMarks: formData.totalMarks,
        passingMarks: formData.passingMarks,
        duration: formData.duration,
        subject: formData.subject,
        examType: formData.examType,
        description: formData.description,
      }
      setExams((prev) => [newExam, ...prev])
    }

    handleCloseModal()
  }

  const handleDeleteExam = (id: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      setExams((prev) => prev.filter((exam) => exam.id !== id))
    }
  }

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case 'Final':
        return 'bg-red-100 text-red-800'
      case 'Mid Term':
        return 'bg-orange-100 text-orange-800'
      case 'Unit Test':
        return 'bg-blue-100 text-blue-800'
      case 'Practical':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Exam Management</h2>
            <button
              onClick={handleAddExam}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
            >
              + Create New Exam
            </button>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500 text-lg">No exams created yet. Click "Create New Exam" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getExamTypeColor(exam.examType)}`}>
                          {exam.examType}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          {exam.subject}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">Class: <span className="font-semibold">{exam.class}</span></p>
                      {exam.description && <p className="text-gray-600 mt-1">{exam.description}</p>}
                      <div className="grid grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-semibold text-gray-900">📅 {exam.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Marks</p>
                          <p className="font-semibold text-gray-900">{exam.totalMarks}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Passing Marks</p>
                          <p className="font-semibold text-green-600">{exam.passingMarks}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-semibold text-gray-900">⏱️ {exam.duration} min</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditExam(exam)}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
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

          {/* Statistics */}
          {exams.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 text-sm font-medium">Total Exams</p>
                <p className="text-3xl font-bold text-blue-600">{exams.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 text-sm font-medium">Final Exams</p>
                <p className="text-3xl font-bold text-red-600">
                  {exams.filter((e) => e.examType === 'Final').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 text-sm font-medium">Mid Term</p>
                <p className="text-3xl font-bold text-orange-600">
                  {exams.filter((e) => e.examType === 'Mid Term').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 text-sm font-medium">Unit Tests</p>
                <p className="text-3xl font-bold text-blue-600">
                  {exams.filter((e) => e.examType === 'Unit Test').length}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Exam' : 'Create New Exam'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mathematics Final Exam"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <NepaliDatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(date: string) => setFormData(prev => ({ ...prev, date }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select class</option>
                    {CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {EXAM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks *</label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Marks *</label>
                  <input
                    type="number"
                    name="passingMarks"
                    value={formData.passingMarks}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
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
                  placeholder="Add exam details or instructions..."
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Preview</h4>
                <div className="bg-white p-4 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-semibold text-gray-900">{formData.name || 'Exam Name'}</h5>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getExamTypeColor(formData.examType)}`}>
                      {formData.examType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Class: {formData.class || 'Select class'} | Subject: {formData.subject}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-semibold">{formData.date || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Marks</p>
                      <p className="font-semibold">{formData.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-semibold">{formData.duration} min</p>
                    </div>
                  </div>
                </div>
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
                onClick={handleSaveExam}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                {editingId ? 'Update Exam' : 'Create Exam'}
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  )
}
