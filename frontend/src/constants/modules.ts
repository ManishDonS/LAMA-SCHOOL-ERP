
export interface ModuleInfo {
    key: string
    label: string
    icon: string
    description: string
    category: string
    href?: string // Optional, for apps that have dedicated pages
}

export const MODULE_CATEGORIES = {
    'Core Modules': [
        'students', 'teachers', 'guardians', 'staff',
        'classes', 'subjects', 'departments', 'academic_years',
        'attendance', 'exams', 'grades', 'timetable',
        'homework', 'library', 'transport', 'fees',
        'expenses', 'payroll', 'accounting', 'finance', 'website'
    ],
    'Communication & Engagement': [
        'announcements', 'events', 'communication', 'notifications'
    ],
    'Apps & Integrations': [
        'sms', 'email', 'biometric', 'gps_tracking',
        'online_classes', 'payment_gateway', 'mobile_app',
        'analytics', 'ai_insights'
    ],
    'System': [
        'settings', 'reports', 'nepali_date'
    ]
}

export const MODULE_DETAILS: Record<string, Omit<ModuleInfo, 'key' | 'category'>> = {
    // Core Modules
    students: { label: 'Students', icon: '👨‍🎓', description: 'Student information and enrollment management', href: '/dashboard/students' },
    teachers: { label: 'Teachers', icon: '👨‍🏫', description: 'Teacher profiles and assignments', href: '/dashboard/teachers' },
    guardians: { label: 'Guardians', icon: '👨‍👩‍👧', description: 'Parent and guardian management', href: '/dashboard/guardians' },
    staff: { label: 'Staff', icon: '👔', description: 'Non-teaching staff management', href: '/dashboard/staff' },
    classes: { label: 'Classes', icon: '🏫', description: 'Class and section management', href: '/dashboard/classes' },
    subjects: { label: 'Subjects', icon: '📚', description: 'Subject and curriculum management', href: '/dashboard/subjects' },
    departments: { label: 'Departments', icon: '🏢', description: 'Department organization', href: '/dashboard/departments' },
    academic_years: { label: 'Academic Years', icon: '📅', description: 'Academic year and term management', href: '/dashboard/academic-years' },
    attendance: { label: 'Attendance', icon: '✅', description: 'Student and staff attendance tracking', href: '/dashboard/attendance' },
    exams: { label: 'Exams', icon: '📝', description: 'Examination and assessment management', href: '/dashboard/exams' },
    grades: { label: 'Grades', icon: '🎓', description: 'Grade and result management', href: '/dashboard/grades' },
    timetable: { label: 'Timetable', icon: '🗓️', description: 'Class schedules and timetables', href: '/dashboard/timetable' },
    homework: { label: 'Homework', icon: '📖', description: 'Homework assignments and tracking', href: '/dashboard/homework' },
    library: { label: 'Library', icon: '📚', description: 'Library and book management', href: '/dashboard/library' },
    transport: { label: 'Transport', icon: '🚌', description: 'School bus and transport management', href: '/dashboard/school-buses' },
    fees: { label: 'Fees', icon: '💰', description: 'Fee structure and collection', href: '/dashboard/fees' },
    expenses: { label: 'Expenses', icon: '💸', description: 'Expense tracking and management', href: '/dashboard/expenses' },
    payroll: { label: 'Payroll', icon: '💵', description: 'Staff payroll and salary management', href: '/dashboard/payroll' },
    accounting: { label: 'Accounting', icon: '📊', description: 'Accounting and financial reports', href: '/dashboard/accounting' },
    finance: { label: 'Finance', icon: '💼', description: 'Financial management and budgeting', href: '/dashboard/finance' },
    website: { label: 'Website', icon: '🌐', description: 'School website management', href: '/dashboard/website' },

    // Communication
    announcements: { label: 'Announcements', icon: '📢', description: 'School-wide announcements', href: '/dashboard/communication' },
    events: { label: 'Events', icon: '🎉', description: 'School events and calendar', href: '/dashboard/events' },
    communication: { label: 'Communication', icon: '💬', description: 'Parent-teacher communication', href: '/dashboard/communication' },
    notifications: { label: 'Notifications', icon: '🔔', description: 'Push notifications and alerts', href: '/dashboard/notifications' },

    // Apps & Integrations (Premium)
    sms: { label: 'SMS', icon: '📱', description: 'SMS notifications to parents', href: '/dashboard/apps/sms' },
    email: { label: 'Email', icon: '📧', description: 'Email integration and notifications', href: '/dashboard/apps/email' },
    biometric: { label: 'Biometric', icon: '👆', description: 'Biometric attendance system', href: '/dashboard/apps/biometric' },
    gps_tracking: { label: 'GPS Tracking', icon: '🗺️', description: 'GPS bus tracking for parents', href: '/dashboard/apps/gps-tracking' },
    online_classes: { label: 'Online Classes', icon: '💻', description: 'Virtual classroom integration', href: '/dashboard/apps/online-classes' },
    payment_gateway: { label: 'Payment Gateway', icon: '💳', description: 'Online fee payment gateway', href: '/dashboard/apps/payment-gateway' },
    mobile_app: { label: 'Mobile App', icon: '📲', description: 'Mobile app access for parents', href: '/dashboard/apps/mobile-app' },
    analytics: { label: 'Analytics', icon: '📈', description: 'Advanced analytics dashboard', href: '/dashboard/apps/analytics' },
    ai_insights: { label: 'AI Insights', icon: '🤖', description: 'AI-powered insights and predictions', href: '/dashboard/apps/ai-insights' },

    // System
    settings: { label: 'Settings', icon: '⚙️', description: 'System settings and configuration', href: '/dashboard/settings' },
    reports: { label: 'Reports', icon: '📄', description: 'Reports and data exports', href: '/dashboard/reports' },
    nepali_date: { label: 'Nepali Date', icon: '🇳🇵', description: 'Nepali date system support', href: '/dashboard/settings' }, // Usually part of settings
}

// Generate the flat list of all modules with categories
export const ALL_MODULES: ModuleInfo[] = Object.entries(MODULE_CATEGORIES).flatMap(([category, keys]) =>
    keys.map(key => {
        const details = MODULE_DETAILS[key] || { label: key, icon: '📦', description: 'Module' }
        return {
            key,
            category,
            ...details
        }
    })
)

// Helper to check if a module is licensed for the school (Master control by Super Admin)
export const isModuleLicensed = (
    permissions: Record<string, any> | undefined,
    moduleKey: string,
    role?: string
): boolean => {
    // Super Admin bypass: Always show as licensed so they can toggle it
    if (role === 'super_admin') return true

    if (!permissions || !permissions[moduleKey]) return false
    const p = permissions[moduleKey]
    // A module is licensed if it has any CRUD permission set to true
    return !!(p.read || p.create || p.update || p.delete)
}

// Helper to check if a module is active (Licensed AND Enabled by tenant)
export const isModuleActive = (
    permissions: Record<string, any> | undefined,
    activeModules: string[] | undefined,
    moduleKey: string,
    role?: string
): boolean => {
    // 1. Must be licensed by Super Admin (with bypass)
    if (!isModuleLicensed(permissions, moduleKey, role)) return false

    // 2. Must be in the active_modules list (Enabled by Tenant)
    // Note: If activeModules is undefined (old data), we fall back to license status 
    // to avoid breaking existing setups, but new behavior will rely on the list.
    if (!activeModules) return true

    return activeModules.includes(moduleKey)
}
