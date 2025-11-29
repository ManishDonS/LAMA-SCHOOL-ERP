import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [stats, setStats] = useState({
    totalStudents: 1250,
    presentToday: 1100,
    pendingFees: 45,
    upcomingExams: 8,
  })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    }
  }, [user, router, isHydrated])

  if (!isHydrated || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Welcome, {user?.firstName}!</h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Present Today</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.presentToday}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Pending Fees</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingFees}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Upcoming Exams</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.upcomingExams}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/dashboard/schools"
              className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg shadow hover:shadow-lg transition border-2 border-purple-200"
            >
              <h3 className="text-lg font-semibold text-purple-900 mb-2">🏢 Schools Management</h3>
              <p className="text-purple-700">Create and manage multiple schools with isolated databases</p>
              <p className="text-xs text-purple-600 mt-2">🔐 SuperAdmin Only</p>
            </Link>

            <Link
              href="/dashboard/students"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Students</h3>
              <p className="text-gray-600">Manage student information and records</p>
            </Link>

            <Link
              href="/dashboard/attendance"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance</h3>
              <p className="text-gray-600">Track student attendance records</p>
            </Link>

            <Link
              href="/dashboard/fees"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fees</h3>
              <p className="text-gray-600">Manage student fee records</p>
            </Link>

            <Link
              href="/dashboard/exams"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Exams</h3>
              <p className="text-gray-600">Create and manage exams</p>
            </Link>

            <Link
              href="/dashboard/notifications"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
              <p className="text-gray-600">Send notifications to students</p>
            </Link>

            <Link
              href="/dashboard/reports"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
              <p className="text-gray-600">View system reports and analytics</p>
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
