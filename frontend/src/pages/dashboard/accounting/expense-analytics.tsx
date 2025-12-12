import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { AnalyticsDashboard } from '@/components/expenses/AnalyticsDashboard'
import { BudgetDashboard } from '@/components/expenses/BudgetDashboard'

const ExpenseAnalyticsPage = () => {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'analytics' | 'budget'>('analytics')

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            <Head>
                <title>Expense Analytics | LAMA School ERP</title>
            </Head>

            <Navbar showBackButton={true} backLink="/dashboard/accounting/expenses" />

            <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
                <Sidebar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Expense Analytics & Budget Tracking
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Monitor spending trends and track budget usage
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                            <div className="flex border-b border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className={`px-6 py-3 font-medium transition-colors ${activeTab === 'analytics'
                                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    📊 Analytics
                                </button>
                                <button
                                    onClick={() => setActiveTab('budget')}
                                    className={`px-6 py-3 font-medium transition-colors ${activeTab === 'budget'
                                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    💰 Budget Tracking
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        {activeTab === 'analytics' && <AnalyticsDashboard />}
                        {activeTab === 'budget' && <BudgetDashboard />}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default ExpenseAnalyticsPage
