import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

interface AccountingModule {
  id: string
  name: string
  icon: string
  description: string
  href: string
}

const ACCOUNTING_MODULES: AccountingModule[] = [
  {
    id: 'fee-management',
    name: 'Fee Management',
    icon: '💰',
    description: 'Manage student fees, payments, and invoices',
    href: '/dashboard/accounting/fee-management',
  },
  {
    id: 'invoice-management',
    name: 'Invoice Management',
    icon: '🧾',
    description: 'Create and manage invoices for students and parents',
    href: '/dashboard/accounting/invoice-management',
  },
  // Future modules can be added here
  // {
  //   id: 'expenses',
  //   name: 'Expenses',
  //   icon: '💸',
  //   description: 'Track and manage school expenses',
  //   href: '/dashboard/accounting/expenses',
  // },
  // {
  //   id: 'payroll',
  //   name: 'Payroll',
  //   icon: '💵',
  //   description: 'Manage staff salaries and payroll',
  //   href: '/dashboard/accounting/payroll',
  // },
]

export default function AccountingPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [showModuleDropdown, setShowModuleDropdown] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    }
  }, [user, router, isHydrated])

  if (!isHydrated || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Accounting Dashboard</h2>
              <p className="text-gray-600">Manage all accounting-related activities from one place</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">₹0</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <span className="text-2xl">💵</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Pending Fees</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">₹0</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">₹0</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <span className="text-2xl">💸</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting Modules Grid */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Accounting Modules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ACCOUNTING_MODULES.map((module) => (
                  <Link
                    key={module.id}
                    href={module.href}
                    className="bg-white p-6 rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-600 transition-colors">
                        <span className="text-3xl group-hover:scale-110 transition-transform inline-block">{module.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {module.name}
                        </h4>
                        <p className="text-sm text-gray-600">{module.description}</p>
                        <p className="text-xs text-blue-600 mt-2 group-hover:underline">Click to open →</p>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Coming Soon Cards */}
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 p-3 rounded-lg">
                      <span className="text-3xl">💸</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-500 mb-1">Expenses Management</h4>
                      <p className="text-sm text-gray-400">Track and manage school expenses</p>
                      <p className="text-xs text-gray-400 mt-2">Coming soon...</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 p-3 rounded-lg">
                      <span className="text-3xl">💵</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-500 mb-1">Payroll Management</h4>
                      <p className="text-sm text-gray-400">Manage staff salaries and payroll</p>
                      <p className="text-xs text-gray-400 mt-2">Coming soon...</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 p-3 rounded-lg">
                      <span className="text-3xl">📊</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-500 mb-1">Financial Reports</h4>
                      <p className="text-sm text-gray-400">Generate financial reports and analytics</p>
                      <p className="text-xs text-gray-400 mt-2">Coming soon...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg">No recent activity</p>
                  <p className="text-sm mt-2">Activity will appear here once you start using the accounting modules</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
