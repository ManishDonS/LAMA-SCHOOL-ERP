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
    <nav className="sticky top-0 z-40 bg-white shadow-lg border-b-4 border-blue-600">
      <div className="px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link href={backLink} className="flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors group">
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
              Back
            </Link>
          )}

          {/* Logo and System/School Name */}
          <Link href="/dashboard" className="flex items-center gap-3">
            {displayLogo && (
              <img
                src={displayLogo}
                alt={displayName}
                className="h-10 w-10 object-contain rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {displayName}
              </h1>
              {shouldShowSchool && (
                <p className="text-xs text-gray-500">School Code: {selectedSchool.code}</p>
              )}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-4 relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0) || 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <span className="text-gray-600">▼</span>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-48 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  {shouldShowSchool && (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200 bg-blue-50">
                        <p className="text-xs font-medium text-blue-900">Current School</p>
                        <p className="text-sm font-semibold text-blue-700">{selectedSchool.name}</p>
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
