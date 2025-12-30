import { User } from '../types'

export type UserRole = User['role']

export interface MenuItem {
  href: string
  label: string
  icon: string
  roles: UserRole[]
}

// Define which roles can access which menu items
export const MENU_ITEMS: MenuItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: '📊',
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'staff'],
  },
  {
    href: '/dashboard/communication',
    label: 'Communication',
    icon: '💬',
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'staff'],
  },
  {
    href: '/dashboard/schools',
    label: 'Schools Management',
    icon: '🏢',
    roles: ['super_admin'], // Only super admin can manage schools
  },
  {
    href: '/dashboard/students',
    label: 'Students',
    icon: '👨‍🎓',
    roles: ['super_admin', 'admin', 'teacher'],
  },
  {
    href: '/dashboard/teachers',
    label: 'Teachers',
    icon: '👨‍🏫',
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/dashboard/guardians',
    label: 'Guardians',
    icon: '👨‍👩‍👧',
    roles: ['super_admin', 'admin', 'teacher'],
  },
  {
    href: '/dashboard/staff',
    label: 'Staff',
    icon: '👔',
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/dashboard/attendance',
    label: 'Attendance',
    icon: '📋',
    roles: ['super_admin', 'admin', 'teacher', 'student'],
  },
  {
    href: '/dashboard/accounting',
    label: 'Accounting',
    icon: '💰',
    roles: ['super_admin', 'admin', 'staff'],
  },
  {
    href: '/dashboard/payroll',
    label: 'Payroll',
    icon: '💵',
    roles: ['super_admin', 'admin', 'staff'],
  },
  {
    href: '/dashboard/fees',
    label: 'Fees',
    icon: '💸',
    roles: ['super_admin', 'admin', 'staff'],
  },
  {
    href: '/dashboard/accounting/expenses',
    label: 'Expenses',
    icon: '📉',
    roles: ['super_admin', 'admin', 'staff'],
  },
  {
    href: '/dashboard/library',
    label: 'Library',
    icon: '📚',
    roles: ['super_admin', 'admin', 'teacher', 'student', 'staff'],
  },
  {
    href: '/dashboard/classes',
    label: 'Classes',
    icon: '🏫',
    roles: ['super_admin', 'admin', 'teacher', 'student'],
  },
  {
    href: '/dashboard/exams',
    label: 'Exams',
    icon: '📝',
    roles: ['super_admin', 'admin', 'teacher', 'student'],
  },
  {
    href: '/dashboard/exam-settings',
    label: 'Exam Settings',
    icon: '⚙️',
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/dashboard/notifications',
    label: 'Notifications',
    icon: '🔔',
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'staff'],
  },
  {
    href: '/dashboard/reports',
    label: 'Reports',
    icon: '📈',
    roles: ['super_admin', 'admin', 'teacher'],
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: '⚙️',
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'staff'],
  },
  {
    href: '/dashboard/school-buses',
    label: 'School Buses',
    icon: '🚌',
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'staff'],
  },
  {
    href: '/dashboard/permissions',
    label: 'Permissions',
    icon: '🔐',
    roles: ['super_admin'], // Only super admin can manage permissions
  },
  {
    href: '/website-builder',
    label: 'Website Builder',
    icon: '🌐',
    roles: ['super_admin', 'admin', 'teacher'],
  },
  {
    href: '/dashboard/apps',
    label: 'Apps',
    icon: '🧩',
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'staff'],
  },
]

/**
 * Check if a user has permission to access a menu item
 */
export const hasPermission = (userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}

/**
 * Get custom permissions from localStorage
 */
const getCustomPermissions = (): Record<string, UserRole[]> | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem('custom_permissions')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Error loading custom permissions:', error)
    return null
  }
}

/**
 * Get menu items with custom or default permissions applied
 */
const getMenuItemsWithPermissions = (): MenuItem[] => {
  const customPermissions = getCustomPermissions()

  if (!customPermissions) {
    return MENU_ITEMS
  }

  // Apply custom permissions
  return MENU_ITEMS.map((item) => ({
    ...item,
    roles: customPermissions[item.href] || item.roles,
  }))
}

/**
 * Get menu items that the user has permission to access
 */
/**
 * Map menu paths to module permission keys
 */
const MODULE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard/students': 'students',
  '/dashboard/teachers': 'teachers',
  '/dashboard/guardians': 'guardians',
  '/dashboard/staff': 'staff',
  '/dashboard/classes': 'classes',
  '/dashboard/attendance': 'attendance',
  '/dashboard/exams': 'exams',
  '/dashboard/exam-settings': 'exams',
  '/dashboard/library': 'library',
  '/dashboard/school-buses': 'transport',
  '/dashboard/accounting': 'accounting',
  '/dashboard/notifications': 'notifications',
  '/dashboard/reports': 'reports',
  '/website-builder': 'website',
  '/dashboard/settings': 'settings',
  '/dashboard/fees': 'fees',
  '/dashboard/accounting/expenses': 'expenses',
  '/dashboard/payroll': 'payroll',
  '/dashboard/communication': 'notifications', // Using notifications permission for communication module
}

/**
 * Get module ID for a given path
 */
const getModuleForPath = (path: string): string | null => {
  if (path.includes('communication')) return 'communication'
  if (path.includes('website-builder')) return 'website'

  // Check if there is a direct mapping in MODULE_PERMISSION_MAP
  const mappedModule = MODULE_PERMISSION_MAP[path]
  if (mappedModule) return mappedModule

  // Core features (Dashboard, etc.) are always visible
  return null
}

/**
 * Get menu items that the user has permission to access
 */
export const getAccessibleMenuItems = (
  userRole: UserRole | undefined,
  activeModules?: string[],
  modulePermissions?: Record<string, any>
): MenuItem[] => {
  if (!userRole) return []

  let menuItems = getMenuItemsWithPermissions()

  // 1. License Check (Master Control) - applies to ALL roles
  // If a module is NOT licensed, it's NOT available in the system
  if (modulePermissions) {
    menuItems = menuItems.filter((item) => {
      const moduleKey = getModuleForPath(item.href)
      if (!moduleKey) return true // Core feature

      const perms = modulePermissions[moduleKey]
      if (!perms) return false
      return !!(perms.read || perms.create || perms.update || perms.delete)
    })
  }

  // 2. Activation Check - applies to ALL roles for sidebar visibility
  // If a module is licensed but NOT activated by the school, hide it from sidebar
  if (activeModules) {
    menuItems = menuItems.filter((item) => {
      const module = getModuleForPath(item.href)
      if (!module) return true // Core feature
      return activeModules.includes(module)
    })
  }

  // 3. Role/CRUD Permission Check - applies to non-Super Admin roles
  if (userRole !== 'super_admin' && modulePermissions) {
    menuItems = menuItems.filter((item) => {
      const moduleKey = MODULE_PERMISSION_MAP[item.href]
      if (!moduleKey) return true

      const perms = modulePermissions[moduleKey]
      // We already checked license above, but non-super admin might have specific CRUD restrictions
      // For now, any permission is enough to see the menu item
      return !!(perms.read || perms.create || perms.update || perms.delete)
    })
  }

  return menuItems.filter((item) => hasPermission(userRole, item.roles))
}

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (userRole: UserRole | undefined, route: string): boolean => {
  if (!userRole) return false

  // Get menu items with custom permissions applied
  const menuItems = getMenuItemsWithPermissions()

  // Find the menu item for this route
  const menuItem = menuItems.find((item) => route.startsWith(item.href))

  // If no menu item found, allow access (for custom routes)
  if (!menuItem) return true

  return hasPermission(userRole, menuItem.roles)
}

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (userRole: UserRole | undefined): boolean => {
  return userRole === 'super_admin'
}

/**
 * Check if user is admin or super admin
 */
export const isAdmin = (userRole: UserRole | undefined): boolean => {
  return userRole === 'super_admin' || userRole === 'admin'
}

/**
 * Check if user is teacher
 */
export const isTeacher = (userRole: UserRole | undefined): boolean => {
  return userRole === 'teacher'
}

/**
 * Check if user is student
 */
export const isStudent = (userRole: UserRole | undefined): boolean => {
  return userRole === 'student'
}
