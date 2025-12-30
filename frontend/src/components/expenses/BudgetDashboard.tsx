import React, { useState, useEffect } from 'react'
import { expensesAPI } from '@/services/expenseAPI'
import { toast } from 'react-hot-toast'

interface BudgetCategory {
    categoryId: string
    categoryName: string
    icon: string
    budget: number
    spent: number
    remaining: number
    percentage: number
    status: 'good' | 'caution' | 'warning' | 'exceeded'
}

interface BudgetData {
    year: number
    month: number
    categories: BudgetCategory[]
    totalBudget: number
    totalSpent: number
    totalRemaining: number
    overallPercentage: number
}

interface BudgetDashboardProps {
    schoolId?: string
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({ schoolId = '1' }) => {
    const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    useEffect(() => {
        loadBudgetData()
    }, [selectedMonth, selectedYear])

    const loadBudgetData = async () => {
        try {
            setLoading(true)
            const data = await expensesAPI.getBudgetStatus({
                year: selectedYear,
                month: selectedMonth,
            })
            setBudgetData(data)
        } catch (error) {
            console.error('Error loading budget data:', error)
            toast.error('Failed to load budget tracking data')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good':
                return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            case 'caution':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
            case 'warning':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
            case 'exceeded':
                return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }
    }

    const getProgressBarColor = (status: string) => {
        switch (status) {
            case 'good':
                return 'bg-green-600'
            case 'caution':
                return 'bg-yellow-600'
            case 'warning':
                return 'bg-orange-600'
            case 'exceeded':
                return 'bg-red-600'
            default:
                return 'bg-gray-600'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-gray-500 dark:text-gray-400">Loading budget data...</div>
            </div>
        )
    }

    if (!budgetData) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-gray-500 dark:text-gray-400">No budget data available</div>
            </div>
        )
    }

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    return (
        <div className="space-y-6">
            {/* Month/Year Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            {months.map((month, idx) => (
                                <option key={idx} value={idx + 1}>
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            {[2024, 2025, 2026].map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Overall Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">
                    Overall Budget - {months[selectedMonth - 1]} {selectedYear}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm opacity-90">Total Budget</p>
                        <p className="text-2xl font-bold">₹{budgetData.totalBudget.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm opacity-90">Total Spent</p>
                        <p className="text-2xl font-bold">₹{budgetData.totalSpent.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm opacity-90">Remaining</p>
                        <p className="text-2xl font-bold">₹{budgetData.totalRemaining.toLocaleString()}</p>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span>Overall Usage</span>
                        <span>{budgetData.overallPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-3">
                        <div
                            className="bg-white h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(budgetData.overallPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Category Budgets */}
            <div className="grid grid-cols-1 gap-4">
                {budgetData.categories.map((category) => (
                    <div
                        key={category.categoryId}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{category.icon}</div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {category.categoryName}
                                    </h4>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(category.status)}`}>
                                        {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    ₹{category.budget.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    ₹{category.spent.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    ₹{category.remaining.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Usage</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {category.percentage.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${getProgressBarColor(category.status)}`}
                                style={{ width: `${Math.min(category.percentage, 100)}%` }}
                            />
                        </div>

                        {category.status === 'exceeded' && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    ⚠️ Budget exceeded by ₹{(category.spent - category.budget).toLocaleString()}
                                </p>
                            </div>
                        )}
                        {category.status === 'warning' && (
                            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    ⚠️ Approaching budget limit
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {budgetData.categories.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No budget data available
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Set up category budgets to start tracking
                    </p>
                </div>
            )}
        </div>
    )
}
