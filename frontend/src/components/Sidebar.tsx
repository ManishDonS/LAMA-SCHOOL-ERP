import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getAccessibleMenuItems, UserRole } from '@/utils/permissions'
import { useAuthStore } from '@/store/authStore'

export default function Sidebar() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use undefined role during SSR to match server output
  const userRole = mounted ? user?.role : undefined
  const menuItems = getAccessibleMenuItems(userRole)

  return (
    <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-56 flex-shrink-0 bg-gradient-to-b from-gray-50 to-white shadow-lg border-r border-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div className="p-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
          Navigation
        </h3>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${router.pathname === item.href
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
