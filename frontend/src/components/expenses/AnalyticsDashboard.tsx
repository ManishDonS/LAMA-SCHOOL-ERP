import React, { useState, useEffect } from 'react'
import { Line, Pie, Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import NepaliDatePicker from '@/components/NepaliDatePicker'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
)

interface AnalyticsData {
    byStatus: Record<string, { count: number; total: number }>
    byCategory: Array<{ name: string; icon: string; count: number; total: number }>
    monthlyTrend: Array<{ month: string; count: number; total: number }>
}

interface AnalyticsDashboardProps {
    schoolId?: string
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ schoolId = '1' }) => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    })

    useEffect(() => {
        loadAnalytics()
    }, [dateRange])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(
                `${API_URL}/expense-service/api/v1/analytics?schoolId=${schoolId}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
            )
            const data = await response.json()
            setAnalytics(data)
        } catch (error) {
            console.error('Error loading analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-gray-500 dark:text-gray-400">No data available</div>
            </div>
        )
    }

    // Prepare chart data
    const categoryChartData = {
        labels: analytics.byCategory?.map(c => c.name) || [],
        datasets: [
            {
                label: 'Amount (₹)',
                data: analytics.byCategory?.map(c => c.total) || [],
                backgroundColor: [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
                ],
            },
        ],
    }

    const trendChartData = {
        labels: analytics.monthlyTrend?.map(t => t.month) || [],
        datasets: [
            {
                label: 'Total Expenses (₹)',
                data: analytics.monthlyTrend?.map(t => t.total) || [],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
            },
        ],
    }

    const statusData = analytics.byStatus || {}
    const statusChartData = {
        labels: Object.keys(statusData).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        datasets: [
            {
                label: 'Count',
                data: Object.values(statusData).map((v: any) => v.count),
                backgroundColor: ['#9CA3AF', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'],
            },
        ],
    }

    return (
        <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Start Date
                        </label>
                        <NepaliDatePicker
                            value={dateRange.startDate}
                            onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                            className="px-0 py-0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            End Date
                        </label>
                        <NepaliDatePicker
                            value={dateRange.endDate}
                            onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                            className="px-0 py-0"
                        />
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Expenses by Category
                    </h3>
                    <div className="h-64">
                        <Pie data={categoryChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Expenses by Status
                    </h3>
                    <div className="h-64">
                        <Bar data={statusChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Monthly Trend (Last 6 Months)
                    </h3>
                    <div className="h-64">
                        <Line data={trendChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            {/* Category Details Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Category Breakdown
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Count
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Total Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {analytics.byCategory?.map((cat, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{cat.icon}</span>
                                            <span className="text-gray-900 dark:text-white">{cat.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                                        {cat.count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                                        ₹{cat.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
