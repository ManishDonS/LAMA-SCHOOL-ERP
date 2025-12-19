import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import Head from 'next/head'

export default function ExamSettingsPage() {
    const { user } = useAuthStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Protect route
    if (user && user.role !== 'super_admin' && user.role !== 'admin') {
        router.push('/dashboard')
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head>
                <title>Exam Settings | LAMA School ERP</title>
            </Head>
            <Navbar />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1">Exam Settings</h1>
                                <p className="text-gray-600">Configure grading scales, exam types, and result parameters</p>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {/* Grading Systems */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <span>📊</span> Grading Systems
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <div>
                                                <h4 className="font-semibold text-blue-900">Default Grade Scale (Letter)</h4>
                                                <p className="text-sm text-blue-700">A+, A, B, C, D, E, F based on percentage</p>
                                            </div>
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Edit Scale</button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">GPA System (4.0 Scale)</h4>
                                                <p className="text-sm text-gray-600">Configure grade points and weighted averages</p>
                                            </div>
                                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold">Activate</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Exam Types Configuration */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <span>📝</span> Exam Types
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {['Unit Test', 'Mid Term', 'Final', 'Practical', 'Viva'].map(type => (
                                            <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
                                                {type}
                                                <button className="hover:text-red-500 transition-colors">×</button>
                                            </span>
                                        ))}
                                        <button className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-200 transition-colors">
                                            + Add New
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Result Publication Settings */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <span>📢</span> Result Publication
                                    </h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Auto-publish to Portal</h4>
                                            <p className="text-sm text-gray-600">Allow students/parents to see results immediately after final lock</p>
                                        </div>
                                        <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-400">
                                        <div>
                                            <h4 className="font-semibold">SMS Result Alerts</h4>
                                            <p className="text-sm">Send grades automatically via SMS (requires SMS module)</p>
                                        </div>
                                        <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
