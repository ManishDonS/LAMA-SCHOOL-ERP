import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getAccessibleMenuItems, UserRole } from '@/utils/permissions'
import { useAuthStore } from '@/store/authStore'

export default function Sidebar() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [modulePermissions, setModulePermissions] = useState<Record<string, any>>({})
  const [localActiveModules, setLocalActiveModules] = useState<string[] | undefined>(undefined)

  useEffect(() => {
    setMounted(true)

    // Load module permissions from selected school
    if (typeof window !== 'undefined') {
      const schoolData = localStorage.getItem('selected_school')
      if (schoolData) {
        try {
          const school = JSON.parse(schoolData)
          if (school.module_permissions) {
            setModulePermissions(school.module_permissions)
          }
          if (school.active_modules) {
            setLocalActiveModules(school.active_modules)
          }
        } catch (error) {
          console.error('Failed to parse school data:', error)
        }
      }
    }
  }, [])

  // Use undefined role during SSR to match server output
  const userRole = mounted ? user?.role : undefined
  const { activeModules: storeActiveModules, modulePermissions: storePermissions } = useAuthStore()

  // Use permissions from selected school (super admin view) or from logged in user (store)
  const effectivePermissions = Object.keys(modulePermissions).length > 0 ? modulePermissions : storePermissions
  const effectiveActiveModules = localActiveModules !== undefined ? localActiveModules : storeActiveModules

  const menuItems = getAccessibleMenuItems(userRole, effectiveActiveModules, effectivePermissions)

  return (
    <aside className="sticky top-[48px] h-[calc(100vh-48px)] w-48 flex-shrink-0 bg-gradient-to-b from-gray-50 to-white shadow-lg border-r border-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div className="p-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
          Navigation
        </h3>
        <nav className="space-y-0.5">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 group ${router.pathname === item.href
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm'
                }`}
            >
              <span
                className={`text-base transition-transform group-hover:scale-110 ${router.pathname === item.href ? '' : 'opacity-70 group-hover:opacity-100'
                  }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
