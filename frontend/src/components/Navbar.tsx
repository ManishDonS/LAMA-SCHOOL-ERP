import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'

interface School {
  id: string
  name: string
  code: string
  logo_url: string
}

interface NavbarProps {
  showBackButton?: boolean
  backLink?: string
}

export default function Navbar({ showBackButton = false, backLink = '/dashboard' }: NavbarProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [systemLogo, setSystemLogo] = useState<string | null>(null)
  const [systemName, setSystemName] = useState('LAMA ERP')

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load selected school from localStorage
    if (typeof window !== 'undefined') {
      const schoolData = localStorage.getItem('selected_school')
      const storedSystemLogo = localStorage.getItem('system_logo')
      const storedSystemName = localStorage.getItem('system_name')

      if (schoolData) {
        try {
          setSelectedSchool(JSON.parse(schoolData))
        } catch (error) {
          console.error('Failed to parse school data:', error)
        }
      }

      if (storedSystemLogo) {
        setSystemLogo(storedSystemLogo)
      }

      if (storedSystemName) {
        setSystemName(storedSystemName)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = async () => {
    await logout()
    // Clear selected school on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selected_school')
    }
    router.push('/auth/login')
  }

  // SuperAdmin always sees system name/logo, others see school name/logo when logged in
  const isSuperAdmin = user?.role === 'super_admin'
  const shouldShowSchool = selectedSchool && !isSuperAdmin

  const displayName = shouldShowSchool ? selectedSchool.name : systemName
  const displayLogo = shouldShowSchool ? selectedSchool.logo_url : systemLogo

  // Prevent hydration mismatch by not rendering user-dependent content until mounted
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-40 bg-white shadow-lg border-b-4 border-blue-600">
        <div className="px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Render basic structure but no user-specific data */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {systemName}
                </h1>
              </div>
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-2 flex justify-between items-center">
        {/* Left: Logo + Department Link */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={displayName}
                className="h-8 w-8 object-contain rounded"
              />
            ) : (
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center text-white font-bold text-sm">
                LAMA
              </div>
            )}
          </Link>

          {/* Staff & Department Management Links - Only show on Staff page */}
          {user && router.pathname === '/dashboard/staff' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (router.pathname === '/dashboard/staff') {
                    // Already on staff page, just switch to staff view
                    window.location.hash = 'staff-view'
                  } else {
                    // Navigate to staff page
                    router.push('/dashboard/staff')
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors group"
                title="View Staff"
              >
                <span className="text-lg">👔</span>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Staff</span>
              </button>

              <button
                onClick={() => {
                  if (router.pathname === '/dashboard/staff') {
                    // Already on staff page, trigger hash change
                    window.location.hash = 'departments'
                  } else {
                    // Navigate to staff page with hash
                    router.push('/dashboard/staff#departments')
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors group"
                title="Manage Departments"
              >
                <span className="text-lg">🏢</span>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Departments</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Settings Icons + User Menu */}
        <div className="flex items-center gap-2">
          {/* Placeholder for future settings icons */}

          {/* User Menu */}
          {user && (
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                title={`${user?.firstName} ${user?.lastName}`}
              >
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0) || 'A'}
                </div>
                <span className="text-gray-600 text-xs">▼</span>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">{user?.role?.replace('_', ' ').toUpperCase()}</p>
                  </div>

                  {shouldShowSchool && (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200 bg-blue-50">
                        <p className="text-xs font-medium text-blue-900">Current School</p>
                        <p className="text-sm font-semibold text-blue-700">{selectedSchool.name}</p>
                        <p className="text-xs text-blue-600">Code: {selectedSchool.code}</p>
                      </div>
                      <Link
                        href="/dashboard/schools"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        🏢 Switch School
                      </Link>
                    </>
                  )}

                  {isSuperAdmin && (
                    <Link
                      href="/dashboard/schools"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      🏢 Manage Schools
                    </Link>
                  )}

                  <Link
                    href="/dashboard/user-profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    👤 My Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    ⚙️ Settings
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition font-semibold"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
