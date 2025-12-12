import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
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

interface Analytics {
    total_assets: number
    total_liabilities: number
    total_equity: number
    total_revenue: number
    total_expenses: number
    net_income: number
    type_distribution: Record<string, number>
    account_count: Record<string, number>
}

interface Transaction {
    id: number
    account_code: string
    account_name: string
    date: string
    description: string
    debit_amount: number
    credit_amount: number
    balance: number
}

export default function AccountAnalyticsPage() {
    const { user } = useAuthStore()
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (isHydrated && !user) {
            router.push('/auth/login')
        }
    }, [user, router, isHydrated])

    useEffect(() => {
        if (isHydrated && user) {
            fetchAnalytics()
            fetchRecentTransactions()
        }
    }, [isHydrated, user])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetch('http://localhost:8009/api/v1/accounts/analytics?school_id=1')
            if (response.ok) {
                const data = await response.json()
                setAnalytics(data)
            }
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchRecentTransactions = async () => {
        try {
            // This would fetch from a transactions endpoint
            // For now, we'll use mock data
            setTransactions([])
        } catch (error) {
            console.error('Error fetching transactions:', error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount)
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num)
    }

    // Chart data
    const typeDistributionData = {
        labels: analytics ? Object.keys(analytics.type_distribution) : [],
        datasets: [
            {
                label: 'Account Balance by Type',
                data: analytics ? Object.values(analytics.type_distribution) : [],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',  // Green for Assets
                    'rgba(239, 68, 68, 0.8)',   // Red for Liabilities
                    'rgba(59, 130, 246, 0.8)',  // Blue for Equity
                    'rgba(168, 85, 247, 0.8)',  // Purple for Revenue
                    'rgba(249, 115, 22, 0.8)',  // Orange for Expenses
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(249, 115, 22, 1)',
                ],
                borderWidth: 2,
            },
        ],
    }

    const accountCountData = {
        labels: analytics ? Object.keys(analytics.account_count) : [],
        datasets: [
            {
                label: 'Number of Accounts',
                data: analytics ? Object.values(analytics.account_count) : [],
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
            },
        ],
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    }

    if (!isHydrated || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar showBackButton={true} backLink="/dashboard/accounting/chart-of-accounts" />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 py-8 px-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Account Analytics</h2>
                            <p className="text-gray-600">Financial overview and account statistics</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="text-gray-500">Loading analytics...</div>
                            </div>
                        ) : analytics ? (
                            <>
                                {/* Summary Statistics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-500">Total Assets</span>
                                            <span className="text-2xl">💰</span>
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(analytics.total_assets)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {analytics.account_count.Asset || 0} accounts
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-500">Total Liabilities</span>
                                            <span className="text-2xl">📊</span>
                                        </div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {formatCurrency(analytics.total_liabilities)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {analytics.account_count.Liability || 0} accounts
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-500">Total Equity</span>
                                            <span className="text-2xl">🏦</span>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(analytics.total_equity)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {analytics.account_count.Equity || 0} accounts
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-500">Net Income</span>
                                            <span className="text-2xl">📈</span>
                                        </div>
                                        <div className={`text-2xl font-bold ${analytics.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(analytics.net_income)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Revenue - Expenses
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue & Expenses */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-medium text-gray-500">Total Revenue</span>
                                            <span className="text-xl">💵</span>
                                        </div>
                                        <div className="text-3xl font-bold text-purple-600">
                                            {formatCurrency(analytics.total_revenue)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {analytics.account_count.Revenue || 0} revenue accounts
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-medium text-gray-500">Total Expenses</span>
                                            <span className="text-xl">💸</span>
                                        </div>
                                        <div className="text-3xl font-bold text-orange-600">
                                            {formatCurrency(analytics.total_expenses)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {analytics.account_count.Expense || 0} expense accounts
                                        </div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    {/* Account Type Distribution */}
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Balance Distribution by Type
                                        </h3>
                                        <div className="h-80">
                                            <Doughnut data={typeDistributionData} options={chartOptions} />
                                        </div>
                                    </div>

                                    {/* Account Count by Type */}
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Number of Accounts by Type
                                        </h3>
                                        <div className="h-80">
                                            <Bar data={accountCountData} options={chartOptions} />
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Ratios */}
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Ratios</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Assets to Liabilities</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {analytics.total_liabilities > 0
                                                    ? (analytics.total_assets / analytics.total_liabilities).toFixed(2)
                                                    : '∞'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Profit Margin</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {analytics.total_revenue > 0
                                                    ? ((analytics.net_income / analytics.total_revenue) * 100).toFixed(2) + '%'
                                                    : '0%'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Expense Ratio</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {analytics.total_revenue > 0
                                                    ? ((analytics.total_expenses / analytics.total_revenue) * 100).toFixed(2) + '%'
                                                    : '0%'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Transactions */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="p-6 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        {transactions.length > 0 ? (
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Account
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Description
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Debit
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Credit
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Balance
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {transactions.map((txn) => (
                                                        <tr key={txn.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {new Date(txn.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{txn.account_name}</div>
                                                                <div className="text-xs text-gray-500">{txn.account_code}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{txn.description}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                                {txn.debit_amount > 0 ? formatCurrency(txn.debit_amount) : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                                {txn.credit_amount > 0 ? formatCurrency(txn.credit_amount) : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                                {formatCurrency(txn.balance)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500">
                                                <p>No transactions found</p>
                                                <p className="text-sm mt-1">Transactions will appear here once accounts are used</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                No analytics data available
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
