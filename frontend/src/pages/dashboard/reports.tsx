import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'

interface Report {
  id: string
  name: string
  type: 'PDF' | 'Excel' | 'CSV' | 'Word'
  category: 'Academic' | 'Attendance' | 'Fees' | 'Performance' | 'Exam' | 'Custom'
  date: string
  description: string
  generatedBy: string
  period?: string
}

interface FormData {
  name: string
  type: 'PDF' | 'Excel' | 'CSV' | 'Word'
  category: 'Academic' | 'Attendance' | 'Fees' | 'Performance' | 'Exam' | 'Custom'
  description: string
  generatedBy: string
  period?: string
}

const REPORT_TYPES = ['PDF', 'Excel', 'CSV', 'Word'] as const
const REPORT_CATEGORIES = ['Academic', 'Attendance', 'Fees', 'Performance', 'Exam', 'Custom'] as const

const DEFAULT_FORM_STATE: FormData = {
  name: '',
  type: 'PDF',
  category: 'Academic',
  description: '',
  generatedBy: 'Admin',
  period: '',
}

export default function ReportsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
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
      const savedReports = localStorage.getItem('reports')
      if (savedReports) {
        try {
          setReports(JSON.parse(savedReports))
        } catch (error) {
          console.error('Failed to load reports:', error)
          const defaultReports: Report[] = [
            {
              id: '1',
              name: 'Student Performance Report',
              type: 'PDF',
              category: 'Performance',
              date: '2024-11-10',
              description: 'Comprehensive student performance analysis for all classes',
              generatedBy: 'Admin',
              period: 'Nov 2024',
            },
            {
              id: '2',
              name: 'Attendance Summary',
              type: 'Excel',
              category: 'Attendance',
              date: '2024-11-09',
              description: 'Monthly attendance records for all students',
              generatedBy: 'Admin',
              period: 'Nov 2024',
            },
            {
              id: '3',
              name: 'Fee Collection Report',
              type: 'PDF',
              category: 'Fees',
              date: '2024-11-08',
              description: 'Complete fee collection and payment status',
              generatedBy: 'Finance',
              period: 'Nov 2024',
            },
          ]
          setReports(defaultReports)
        }
      } else {
        const defaultReports: Report[] = [
          {
            id: '1',
            name: 'Student Performance Report',
            type: 'PDF',
            category: 'Performance',
            date: '2024-11-10',
            description: 'Comprehensive student performance analysis for all classes',
            generatedBy: 'Admin',
            period: 'Nov 2024',
          },
          {
            id: '2',
            name: 'Attendance Summary',
            type: 'Excel',
            category: 'Attendance',
            date: '2024-11-09',
            description: 'Monthly attendance records for all students',
            generatedBy: 'Admin',
            period: 'Nov 2024',
          },
          {
            id: '3',
            name: 'Fee Collection Report',
            type: 'PDF',
            category: 'Fees',
            date: '2024-11-08',
            description: 'Complete fee collection and payment status',
            generatedBy: 'Finance',
            period: 'Nov 2024',
          },
        ]
        setReports(defaultReports)
      }
      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('reports', JSON.stringify(reports))
    }
  }, [reports, isHydrated])

  const handleAddReport = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setShowModal(true)
  }

  const handleEditReport = (report: Report) => {
    setEditingId(report.id)
    setFormData({
      name: report.name,
      type: report.type,
      category: report.category,
      description: report.description,
      generatedBy: report.generatedBy,
      period: report.period,
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
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Please enter report name')
      return false
    }
    if (!formData.generatedBy.trim()) {
      alert('Please enter generated by')
      return false
    }
    return true
  }

  const handleSaveReport = () => {
    if (!validateForm()) return

    if (editingId) {
      // Update existing report
      setReports((prev) =>
        prev.map((report) =>
          report.id === editingId
            ? {
              ...report,
              name: formData.name,
              type: formData.type,
              category: formData.category,
              description: formData.description,
              generatedBy: formData.generatedBy,
              period: formData.period,
              date: new Date().toISOString().split('T')[0],
            }
            : report
        )
      )
    } else {
      // Add new report
      const newReport: Report = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        category: formData.category,
        description: formData.description,
        generatedBy: formData.generatedBy,
        period: formData.period,
        date: new Date().toISOString().split('T')[0],
      }
      setReports((prev) => [newReport, ...prev])
    }

    handleCloseModal()
  }

  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      setReports((prev) => prev.filter((report) => report.id !== id))
    }
  }

  const handleDownloadReport = (reportName: string, reportType: string) => {
    alert(`Downloading ${reportName} as ${reportType}...\n\nNote: In a real application, this would download the file.`)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-100 text-red-800'
      case 'Excel':
        return 'bg-green-100 text-green-800'
      case 'CSV':
        return 'bg-blue-100 text-blue-800'
      case 'Word':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Academic':
        return 'bg-indigo-100 text-indigo-800'
      case 'Attendance':
        return 'bg-yellow-100 text-yellow-800'
      case 'Fees':
        return 'bg-orange-100 text-orange-800'
      case 'Performance':
        return 'bg-pink-100 text-pink-800'
      case 'Exam':
        return 'bg-cyan-100 text-cyan-800'
      case 'Custom':
        return 'bg-gray-100 text-gray-800'
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
            <h2 className="text-3xl font-bold text-gray-900">Reports</h2>
            <button
              onClick={handleAddReport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
            >
              + Generate New Report
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500 text-lg">No reports generated yet. Click "Generate New Report" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(report.type)}`}>
                          {report.type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(report.category)}`}>
                          {report.category}
                        </span>
                      </div>
                      {report.description && <p className="text-gray-600 mt-2">{report.description}</p>}
                      <div className="grid grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-semibold text-gray-900">📅 {report.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Period</p>
                          <p className="font-semibold text-gray-900">{report.period || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Generated By</p>
                          <p className="font-semibold text-gray-900">{report.generatedBy}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Format</p>
                          <p className="font-semibold text-gray-900">{report.type}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleDownloadReport(report.name, report.type)}
                        className="text-green-600 hover:text-green-800 font-semibold hover:underline"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleEditReport(report)}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
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
          {reports.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 text-sm font-medium">Total Reports</p>
                <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 text-sm font-medium">PDF Reports</p>
                <p className="text-3xl font-bold text-red-600">
                  {reports.filter((r) => r.type === 'PDF').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 text-sm font-medium">Excel Reports</p>
                <p className="text-3xl font-bold text-green-600">
                  {reports.filter((r) => r.type === 'Excel').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 text-sm font-medium">Other Formats</p>
                <p className="text-3xl font-bold text-purple-600">
                  {reports.filter((r) => r.type === 'CSV' || r.type === 'Word').length}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Report' : 'Generate New Report'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Student Performance Report"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {REPORT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {REPORT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Generated By *</label>
                  <input
                    type="text"
                    name="generatedBy"
                    value={formData.generatedBy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Admin, Finance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                  <input
                    type="text"
                    name="period"
                    value={formData.period || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Nov 2024"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add report details or notes..."
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Preview</h4>
                <div className="bg-white p-4 rounded border border-blue-200 space-y-2">
                  <h5 className="font-semibold text-gray-900">{formData.name || 'Report Name'}</h5>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(formData.type)}`}>
                      {formData.type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(formData.category)}`}>
                      {formData.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Generated By: {formData.generatedBy || 'Not specified'}</p>
                  {formData.period && <p className="text-sm text-gray-600">Period: {formData.period}</p>}
                  {formData.description && <p className="text-sm text-gray-600 mt-2">{formData.description}</p>}
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
                onClick={handleSaveReport}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                {editingId ? 'Update Report' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
