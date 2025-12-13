import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { schoolService } from '@/services/schoolService'
import { Module } from '@/types'
import { Toaster, toast } from 'react-hot-toast'
import Head from 'next/head'

export default function AppsPage() {
    const { user, activeModules, setActiveModules } = useAuthStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    // State
    const [modules, setModules] = useState<Module[]>([])
    // activeModules comes from store now
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('All')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [toggling, setToggling] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        if (!user) {
            router.push('/auth/login')
            return
        }

        // Only Super Admin can access
        if (user.role !== 'super_admin') {
            router.push('/dashboard')
            return
        }

        const fetchData = async () => {
            try {
                // If we don't have active modules in store, fetch them
                if (activeModules.length === 0) {
                    const school = await schoolService.getSchool(user.schoolId.toString())
                    setActiveModules(school.active_modules || [])
                }

                const allModules = await schoolService.getModules()
                setModules(allModules)
            } catch (error) {
                console.error('Failed to load apps', error)
                toast.error('Failed to load applications')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user, mounted, router])

    const handleToggle = async (moduleId: string, isActive: boolean) => {
        if (!user?.schoolId) return

        setToggling(moduleId)
        try {
            const updatedSchool = await schoolService.toggleModule(
                user.schoolId.toString(),
                moduleId,
                !isActive
            )
            setActiveModules(updatedSchool.active_modules || [])
            toast.success(
                isActive ? 'Module deactivated successfully' : 'Module activated successfully'
            )
        } catch (error) {
            console.error('Failed to toggle module', error)
            toast.error('Failed to update module status')
        } finally {
            setToggling(null)
        }
    }

    // Get unique categories
    const categories = ['All', ...Array.from(new Set(modules.map(m => m.category)))]

    // Filter logic
    const filteredModules = modules.filter((m) => {
        const isActive = activeModules.includes(m.id)
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && isActive) ||
            (statusFilter === 'inactive' && !isActive)
        return matchesSearch && matchesCategory && matchesStatus
    })

    if (!mounted || !user) return null

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head>
                <title>Apps | LAMA School ERP</title>
            </Head>
            <Navbar />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="h-full flex">
                        {/* Left Sidebar - Categories */}
                        <div className="w-56 bg-white border-r border-gray-200 flex-shrink-0">
                            <div className="p-4 sticky top-0">
                                <div className="mb-6">
                                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                                        Filter by Category
                                    </h2>
                                    <div className="space-y-0.5">
                                        {categories.map((category) => {
                                            const count = category === 'All'
                                                ? modules.length
                                                : modules.filter(m => m.category === category).length
                                            const isActive = selectedCategory === category

                                            return (
                                                <button
                                                    key={category}
                                                    onClick={() => setSelectedCategory(category)}
                                                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-white' : 'bg-gray-300 group-hover:bg-blue-500'
                                                            }`} />
                                                        {category}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-all ${isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                                                        }`}>
                                                        {count}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 p-8">
                            <div className="max-w-7xl mx-auto">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-1">App Marketplace</h1>
                                        <p className="text-gray-600">
                                            Discover and manage {filteredModules.length} powerful modules for your school
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Status Filter Dropdown */}
                                        <div className="relative">
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white text-sm font-medium text-gray-700 cursor-pointer appearance-none"
                                                style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')", backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                                            >
                                                <option value="all">All Apps ({modules.length})</option>
                                                <option value="active">Active ({modules.filter(m => activeModules.includes(m.id)).length})</option>
                                                <option value="inactive">Inactive ({modules.filter(m => !activeModules.includes(m.id)).length})</option>
                                            </select>
                                        </div>

                                        {/* Search Input */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search apps..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 shadow-sm"
                                            />
                                            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                {loading ? (
                                    <div className="flex justify-center items-center h-96">
                                        <div className="relative">
                                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {filteredModules.length === 0 ? (
                                            <div className="text-center py-20">
                                                <div className="text-7xl mb-4 opacity-50">📦</div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No apps found</h3>
                                                <p className="text-gray-500 max-w-md mx-auto">
                                                    {searchQuery
                                                        ? 'Try adjusting your search query or select a different category'
                                                        : 'No apps available in this category'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {filteredModules.map((module) => {
                                                    const isActive = activeModules.includes(module.id)
                                                    const isProcessing = toggling === module.id

                                                    return (
                                                        <div
                                                            key={module.id}
                                                            className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                                                        >
                                                            <div className="p-4">
                                                                {/* Header */}
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                                                                        {module.icon}
                                                                    </div>
                                                                    <div
                                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${isActive
                                                                            ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-sm'
                                                                            : 'bg-gray-100 text-gray-600'
                                                                            }`}
                                                                    >
                                                                        {isActive ? '✓ Active' : 'Inactive'}
                                                                    </div>
                                                                </div>

                                                                {/* Title & Category */}
                                                                <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
                                                                    {module.name}
                                                                </h3>
                                                                <div className="mb-2">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                                        {module.category}
                                                                    </span>
                                                                </div>

                                                                {/* Description */}
                                                                <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                                                    {module.description}
                                                                </p>

                                                                {/* Actions */}
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleToggle(module.id, isActive)}
                                                                        disabled={isProcessing}
                                                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                                                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md'
                                                                            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        {isProcessing
                                                                            ? '⏳ Processing...'
                                                                            : isActive
                                                                                ? 'Deactivate'
                                                                                : 'Activate'}
                                                                    </button>
                                                                    {isActive && (
                                                                        <button className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                                            ⚙️
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <Toaster position="top-right" />
        </div>
    )
}
