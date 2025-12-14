import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
)

export default function FinancialReportsPage() {
    const [activeTab, setActiveTab] = useState<'pnl' | 'ledger' | 'balance' | 'trial'>('pnl')
    const [period, setPeriod] = useState('this-month')

    const pnlData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Income',
                data: [12000, 19000, 15000, 22000, 18000, 24000],
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
            },
            {
                label: 'Expenses',
                data: [8000, 12000, 10000, 14000, 11000, 15000],
                backgroundColor: 'rgba(239, 68, 68, 0.6)',
            },
        ],
    }

    const expenseBreakdown = {
        labels: ['Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Marketing'],
        datasets: [{
            data: [45, 15, 10, 20, 10],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(139, 92, 246, 0.8)',
            ],
        }]
    }

    const mockLedger = [
        { date: '2024-06-01', description: 'Tuition Fees - Grade 10', account: 'Income', type: 'Credit', amount: 50000 },
        { date: '2024-06-02', description: 'Staff Salaries', account: 'Expense', type: 'Debit', amount: 120000 },
        { date: '2024-06-05', description: 'Electricity Bill', account: 'Expense', type: 'Debit', amount: 4500 },
        { date: '2024-06-10', description: 'Bus Maintenance', account: 'Expense', type: 'Debit', amount: 8000 },
        { date: '2024-06-15', description: 'Grant Received', account: 'Income', type: 'Credit', amount: 200000 },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar showBackButton={true} backLink="/dashboard/accounting" />

            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
                            <p className="text-gray-500 mt-1">Advanced financial analytics and reporting</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                📄 Export PDF
                            </button>
                            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                📊 Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-wrap gap-4 items-center">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="this-quarter">This Quarter</option>
                            <option value="ytd">Year to Date</option>
                        </select>
                        <div className="h-6 w-px bg-gray-300 mx-2"></div>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {[
                                { id: 'pnl', label: 'Profit & Loss' },
                                { id: 'ledger', label: 'General Ledger' },
                                { id: 'balance', label: 'Balance Sheet' },
                                { id: 'trial', label: 'Trial Balance' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {activeTab === 'pnl' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">Total Income</p>
                                        <p className="text-2xl font-bold text-green-600 mt-2">₹1,250,000</p>
                                        <p className="text-xs text-green-500 mt-1">↑ 12% vs last period</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                                        <p className="text-2xl font-bold text-red-600 mt-2">₹450,000</p>
                                        <p className="text-xs text-red-500 mt-1">↑ 5% vs last period</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">Net Profit</p>
                                        <p className="text-2xl font-bold text-primary-600 mt-2">₹800,000</p>
                                        <p className="text-xs text-green-500 mt-1">↑ 8% vs last period</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                                        <p className="text-2xl font-bold text-blue-600 mt-2">64%</p>
                                        <p className="text-xs text-gray-400 mt-1">Stable</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                        <h3 className="font-semibold text-gray-900 mb-6">Income vs Expenses Analysis</h3>
                                        <Bar data={pnlData} />
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                        <h3 className="font-semibold text-gray-900 mb-6">Expense Breakdown</h3>
                                        <div className="h-64 flex items-center justify-center">
                                            <Doughnut data={expenseBreakdown} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'ledger' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">General Ledger Transactions</h3>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Account</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {mockLedger.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-600">{row.date}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.description}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{row.account}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {row.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-right font-mono">
                                                    {row.type === 'Credit' ? '+' : '-'} ₹{row.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'balance' && (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full">
                                <h2 className="text-2xl font-bold text-center mb-2">Balance Sheet</h2>
                                <p className="text-center text-gray-500 mb-8">As of June 30, 2024</p>

                                <div className="grid grid-cols-2 gap-12">
                                    <div>
                                        <h3 className="text-lg font-bold border-b-2 border-primary-500 pb-2 mb-4">Assets</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="font-semibold text-gray-700">Current Assets</p>
                                                <div className="flex justify-between text-sm text-gray-600 pl-4 mt-1">
                                                    <span>Cash and Bank</span>
                                                    <span>₹450,000</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600 pl-4 mt-1">
                                                    <span>Accounts Receivable</span>
                                                    <span>₹120,000</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-700">Fixed Assets</p>
                                                <div className="flex justify-between text-sm text-gray-600 pl-4 mt-1">
                                                    <span>School Building</span>
                                                    <span>₹5,000,000</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600 pl-4 mt-1">
                                                    <span>Furniture & Equipment</span>
                                                    <span>₹850,000</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between font-bold text-gray-900 pt-4 border-t border-gray-200 mt-4">
                                                <span>Total Assets</span>
                                                <span>₹6,420,000</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold border-b-2 border-red-500 pb-2 mb-4">Liabilities & Equity</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="font-semibold text-gray-700">Liabilities</p>
                                                <div className="flex justify-between text-sm text-gray-600 pl-4 mt-1">
                                                    <span>Accounts Payable</span>
                                                    <span>₹80,000</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600 pl-4 mt-1">
                                                    <span>Bank Loans</span>
                                                    <span>₹1,200,000</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-700">Equity</p>
                                                <div className="flex justify-between text-sm text-gray-600 pl-4 mt-1">
                                                    <span>Capital Fund</span>
                                                    <span>₹4,000,000</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600 pl-4 mt-1">
                                                    <span>Retained Earnings</span>
                                                    <span>₹1,140,000</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between font-bold text-gray-900 pt-4 border-t border-gray-200 mt-4">
                                                <span>Total Liabilities & Equity</span>
                                                <span>₹6,420,000</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'trial' && (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full">
                                <h2 className="text-2xl font-bold text-center mb-8">Trial Balance</h2>
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 font-semibold">Account Title</th>
                                            <th className="text-right py-3 font-semibold w-40">Debit</th>
                                            <th className="text-right py-3 font-semibold w-40">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr className="py-2"><td className="py-2">Cash</td><td className="text-right font-mono">450,000</td><td className="text-right font-mono">-</td></tr>
                                        <tr className="py-2"><td className="py-2">Accounts Receivable</td><td className="text-right font-mono">120,000</td><td className="text-right font-mono">-</td></tr>
                                        <tr className="py-2"><td className="py-2">Equipment</td><td className="text-right font-mono">850,000</td><td className="text-right font-mono">-</td></tr>
                                        <tr className="py-2"><td className="py-2">Accounts Payable</td><td className="text-right font-mono">-</td><td className="text-right font-mono">80,000</td></tr>
                                        <tr className="py-2"><td className="py-2">Capital</td><td className="text-right font-mono">-</td><td className="text-right font-mono">1,340,000</td></tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold border-t-2 border-gray-800 bg-gray-50">
                                            <td className="py-3 pl-2">Total</td>
                                            <td className="text-right py-3 font-mono text-primary-700">1,420,000</td>
                                            <td className="text-right py-3 font-mono text-primary-700">1,420,000</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
