import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'

interface Notification {
  id: string
  title: string
  message: string
  date: string
  priority: 'Low' | 'Medium' | 'High'
  category: string
}

interface FormData {
  title: string
  message: string
  priority: 'Low' | 'Medium' | 'High'
  category: string
}

const CATEGORIES = [
  'General',
  'Academic',
  'Fee Related',
  'Event',
  'Holiday',
  'Examination',
  'Transportation',
  'Health & Safety',
  'Administration',
  'Emergency',
]

const DEFAULT_FORM_STATE: FormData = {
  title: '',
  message: '',
  priority: 'Medium',
  category: 'General',
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
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
      const savedNotifications = localStorage.getItem('notifications')
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications))
        } catch (error) {
          console.error('Failed to load notifications:', error)
          const defaultNotifications: Notification[] = [
            {
              id: '1',
              title: 'School Closed',
              message: 'School will be closed on 15th Nov',
              date: '2024-11-10',
              priority: 'High',
              category: 'Holiday'
            },
            {
              id: '2',
              title: 'Fee Submission',
              message: 'November fees are due',
              date: '2024-11-09',
              priority: 'Medium',
              category: 'Fee Related'
            },
            {
              id: '3',
              title: 'Exam Schedule',
              message: 'Final exams starting 20th Nov',
              date: '2024-11-08',
              priority: 'High',
              category: 'Examination'
            },
          ]
          setNotifications(defaultNotifications)
        }
      } else {
        const defaultNotifications: Notification[] = [
          {
            id: '1',
            title: 'School Closed',
            message: 'School will be closed on 15th Nov',
            date: '2024-11-10',
            priority: 'High',
            category: 'Holiday'
          },
          {
            id: '2',
            title: 'Fee Submission',
            message: 'November fees are due',
            date: '2024-11-09',
            priority: 'Medium',
            category: 'Fee Related'
          },
          {
            id: '3',
            title: 'Exam Schedule',
            message: 'Final exams starting 20th Nov',
            date: '2024-11-08',
            priority: 'High',
            category: 'Examination'
          },
        ]
        setNotifications(defaultNotifications)
      }
      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }
  }, [notifications, isHydrated])

  const handleAddNotification = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setShowModal(true)
  }

  const handleEditNotification = (notification: Notification) => {
    setEditingId(notification.id)
    setFormData({
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      category: notification.category,
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
    if (!formData.title.trim()) {
      alert('Please enter notification title')
      return false
    }
    if (!formData.message.trim()) {
      alert('Please enter notification message')
      return false
    }
    return true
  }

  const handleSaveNotification = () => {
    if (!validateForm()) return

    if (editingId) {
      // Update existing notification
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === editingId
            ? {
              ...n,
              title: formData.title,
              message: formData.message,
              priority: formData.priority,
              category: formData.category,
              date: new Date().toISOString().split('T')[0],
            }
            : n
        )
      )
    } else {
      // Add new notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        category: formData.category,
        date: new Date().toISOString().split('T')[0],
      }
      setNotifications((prev) => [newNotification, ...prev])
    }

    handleCloseModal()
  }

  const handleDeleteNotification = (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      case 'Medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      case 'Low':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-4 bg-gray-100 dark:bg-gray-900">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h2>
            <button
              onClick={handleAddNotification}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md">
              + Send New Notification
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No notifications yet. Click "Send New Notification" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{notif.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(notif.priority)}`}>
                          {notif.priority}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {notif.category}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">{notif.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">📅 {notif.date}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditNotification(notif)}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="text-red-600 hover:text-red-800 font-semibold hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statistics */}
          {notifications.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Notifications</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{notifications.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">High Priority</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {notifications.filter((n) => n.priority === 'High').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Medium Priority</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {notifications.filter((n) => n.priority === 'Medium').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Low Priority</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {notifications.filter((n) => n.priority === 'Low').length}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Notification' : 'Send New Notification'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-3xl font-bold">
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notification message"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Preview</h4>
                <div className="bg-white dark:bg-gray-700 p-4 rounded border border-blue-200 dark:border-blue-700">
                  <h5 className="font-semibold text-gray-900 dark:text-white">{formData.title || 'Notification Title'}</h5>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{formData.message || 'Notification message will appear here...'}</p>
                  <div className="flex gap-2 mt-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(formData.priority)}`}>
                      {formData.priority}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {formData.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-semibold">
                Cancel
              </button>
              <button
                onClick={handleSaveNotification}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md">
                {editingId ? 'Update Notification' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
