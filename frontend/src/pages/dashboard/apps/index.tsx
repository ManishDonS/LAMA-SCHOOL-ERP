import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import { ALL_MODULES, isModuleActive, isModuleLicensed } from '@/constants/modules'
import { schoolAPI } from '@/services/api'

export default function AppsDashboard() {
    const router = useRouter()
    const { user, modulePermissions: storePermissions, activeModules: storeActiveModules } = useAuthStore()
    const [modulePermissions, setModulePermissions] = useState<Record<string, any>>({})
    const [activeModules, setActiveModules] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('All')

    useEffect(() => {
        console.log('[Apps] useEffect triggered')
        console.log('[Apps] storePermissions:', storePermissions)
        console.log('[Apps] storeActiveModules:', storeActiveModules)
        console.log('[Apps] user:', user)

        // Load module permissions and active modules from selected school (Super Admin view)
        // or from the auth store (Regular tenant view)
        if (typeof window !== 'undefined') {
            const schoolData = localStorage.getItem('selected_school')
            console.log('[Apps] selected_school from localStorage:', schoolData)

            if (schoolData) {
                try {
                    const school = JSON.parse(schoolData)
                    console.log('[Apps] Parsed school data:', school)
                    if (school.id) {
                        setCurrentSchoolId(school.id)
                    }
                    // Prioritize school-specific data when "logged into" a school as Super Admin
                    if (school.module_permissions) {
                        console.log('[Apps] Setting permissions from selected_school')
                        setModulePermissions(school.module_permissions)
                    }
                    if (school.active_modules) {
                        console.log('[Apps] Setting active modules from selected_school')
                        setActiveModules(school.active_modules)
                    }
                } catch (error) {
                    console.error('[Apps] Failed to parse school data:', error)
                    setModulePermissions(storePermissions)
                    setActiveModules(storeActiveModules)
                }
            } else {
                // For regular tenant users, use permissions and active modules from auth store
                console.log('[Apps] No selected_school, using store data')
                console.log('[Apps] Setting permissions from store:', storePermissions)
                console.log('[Apps] Setting active modules from store:', storeActiveModules)
                setModulePermissions(storePermissions)
                setActiveModules(storeActiveModules)
                if (user?.schoolId) {
                    setCurrentSchoolId(String(user.schoolId))
                }
            }
            setLoading(false)
        }
    }, [storePermissions, storeActiveModules, user])

    // Use permissions from selected school (super admin view) or from logged in user (store)
    const effectivePermissions = Object.keys(modulePermissions).length > 0 ? modulePermissions : storePermissions

    // Get all unique categories
    const categories = ['All', ...Array.from(new Set(ALL_MODULES.map(m => m.category || 'Other')))]

    // Group apps by category, but filter if a specific category is selected
    const categorizedModules = ALL_MODULES.reduce((acc, module) => {
        const category = module.category || 'Other'
        if (selectedCategory !== 'All' && category !== selectedCategory) {
            return acc
        }
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(module)
        return acc
    }, {} as Record<string, typeof ALL_MODULES>)

    const handleToggle = async (moduleKey: string, currentStatus: boolean) => {
        if (!currentSchoolId || toggling) return

        // Check if licensed before allowing toggle
        if (!isModuleLicensed(effectivePermissions, moduleKey, user?.role)) {
            alert('This module is not licensed for your school. Please contact support.')
            return
        }

        // Optimistic update
        const newStatus = !currentStatus
        setToggling(moduleKey)

        // Update local activeModules state immediately
        const newActiveModules = newStatus
            ? [...activeModules, moduleKey]
            : activeModules.filter(m => m !== moduleKey)

        setActiveModules(newActiveModules)

        try {
            await schoolAPI.toggleModule(currentSchoolId, moduleKey, newStatus)

            // Update local storage to persist change
            if (typeof window !== 'undefined') {
                const schoolData = localStorage.getItem('selected_school')
                if (schoolData) {
                    const school = JSON.parse(schoolData)
                    school.active_modules = newActiveModules
                    localStorage.setItem('selected_school', JSON.stringify(school))

                    // Notify other components (Sidebar) about the change
                    window.dispatchEvent(new Event('schoolDataUpdated'))
                }
            }
        } catch (error) {
            console.error('Failed to toggle module:', error)
            // Revert on error
            setActiveModules(activeModules)
            alert('Failed to update module status. Please try again.')
        } finally {
            setToggling(null)
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Core Modules': return '📦'
            case 'Communication & Engagement': return '💬'
            case 'Finance': return '💰'
            case 'Operations': return '⚙️'
            case 'Apps & Integrations': return '🧩'
            case 'System': return '🛠️'
            default: return '📁'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 p-8 flex flex-col lg:flex-row gap-8">
                    {/* Category Sidebar (Localized) */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-1">
                            <h3 className="text-[11px] font-black text-gray-500/70 uppercase tracking-[0.2em] px-4 mb-4">
                                Categories
                            </h3>
                            <nav className="space-y-1">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${selectedCategory === cat
                                            ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-blue-600 border border-gray-100 ring-4 ring-blue-50/50'
                                            : 'text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-900 border border-transparent'
                                            }`}
                                    >
                                        <span className={`text-lg transition-all duration-300 ${selectedCategory === cat ? 'scale-110' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'
                                            }`}>
                                            {cat === 'All' ? '🌈' : getCategoryIcon(cat)}
                                        </span>
                                        <span className="truncate">{cat}</span>
                                        {selectedCategory === cat && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-3xl">🚀</span> Apps & Integrations
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage all available modules and premium applications for your school.
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {Object.entries(categorizedModules).map(([category, modules]) => (
                                    <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
                                            {getCategoryIcon(category)}
                                            <span>{category}</span>
                                            <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {modules.length}
                                            </span>
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {modules.map((module) => {
                                                const licensed = isModuleLicensed(effectivePermissions, module.key, user?.role)
                                                const active = isModuleActive(effectivePermissions, activeModules, module.key, user?.role)
                                                const isToggling = toggling === module.key

                                                return (
                                                    <div
                                                        key={module.key}
                                                        className={`group relative bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 ${!licensed
                                                            ? 'border-gray-200 bg-gray-50 opacity-75'
                                                            : active
                                                                ? 'border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200'
                                                                : 'border-gray-100 border-dashed bg-gray-50/30'
                                                            }`}
                                                    >
                                                        {/* Toggle Switch or Locked Icon */}
                                                        <div className="absolute top-4 right-4 z-20">
                                                            {!licensed ? (
                                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-200 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                    </svg>
                                                                    Locked
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleToggle(module.key, active);
                                                                    }}
                                                                    disabled={isToggling}
                                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${active ? 'bg-blue-600' : 'bg-gray-200'
                                                                        } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                                                                >
                                                                    <span className="sr-only">Toggle Module</span>
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'
                                                                            }`}
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className={`relative z-10 ${(!active || !licensed) && 'opacity-60 grayscale-[0.8]'}`}>
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-all duration-300 ${active && licensed
                                                                ? 'bg-blue-50 text-blue-600 shadow-inner'
                                                                : 'bg-gray-100 text-gray-400'
                                                                }`}>
                                                                {module.icon}
                                                            </div>

                                                            <h3 className={`text-lg font-bold mb-2 transition-colors ${active && licensed ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-500'
                                                                }`}>
                                                                {module.label}
                                                            </h3>

                                                            <p className="text-sm text-gray-500 mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                                                                {module.description}
                                                            </p>

                                                            {active && licensed && module.href ? (
                                                                <Link
                                                                    href={module.href}
                                                                    className="inline-flex items-center gap-2 text-blue-600 text-sm font-bold group/link"
                                                                >
                                                                    <span>Open Module</span>
                                                                    <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                    </svg>
                                                                </Link>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${!licensed ? 'bg-red-400' : active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                                        {!licensed ? 'Unlicensed' : active ? 'Subscribed' : 'Not Active'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(categorizedModules).length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                        <span className="text-6xl mb-4">🔍</span>
                                        <p className="text-lg font-medium">No modules found in this category.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

