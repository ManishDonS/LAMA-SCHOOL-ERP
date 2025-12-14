import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { CategoryModal } from '@/components/expenses/CategoryModal'
import { MOCK_EXPENSES, MOCK_CATEGORIES, Expense, ExpenseCategory, ExpenseFilters as Filters, ExpenseStats } from '@/components/expenses/types'
import { expensesAPI, expenseCategoriesAPI } from '@/services/expenseAPI'

const ExpensesPage = () => {
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<Filters>({})

    useEffect(() => {
        setIsHydrated(true)
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [expensesData, categoriesData] = await Promise.all([
                expensesAPI.getAll().catch(() => MOCK_EXPENSES),
                expenseCategoriesAPI.getAll().catch(() => MOCK_CATEGORIES),
            ])
            setExpenses(expensesData)
            setCategories(categoriesData)
        } catch (error) {
            console.error('Error loading data:', error)
            // Fallback to mock data
            setExpenses(MOCK_EXPENSES)
            setCategories(MOCK_CATEGORIES)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Apply filters
        let filtered = [...expenses]

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase()
            filtered = filtered.filter(exp =>
                exp.description.toLowerCase().includes(query) ||
                exp.vendorName?.toLowerCase().includes(query)
            )
        }

        if (filters.categoryId) {
            filtered = filtered.filter(exp => exp.categoryId === filters.categoryId)
        }

        if (filters.status) {
            filtered = filtered.filter(exp => exp.status === filters.status)
        }

        if (filters.dateFrom) {
            filtered = filtered.filter(exp => exp.expenseDate >= filters.dateFrom!)
        }

        if (filters.dateTo) {
            filtered = filtered.filter(exp => exp.expenseDate <= filters.dateTo!)
        }

        if (filters.minAmount !== undefined) {
            filtered = filtered.filter(exp => exp.amount >= filters.minAmount!)
        }

        if (filters.maxAmount !== undefined) {
            filtered = filtered.filter(exp => exp.amount <= filters.maxAmount!)
        }

        setFilteredExpenses(filtered)
    }, [filters, expenses])

    if (!isHydrated) {
        return null
    }

    // Calculate stats
    const stats: ExpenseStats = {
        totalExpenses: expenses.length,
        pendingApproval: expenses.filter(e => e.status === 'pending').length,
        approvedThisMonth: expenses.filter(e => e.status === 'approved' && new Date(e.expenseDate).getMonth() === new Date().getMonth()).length,
        budgetUsedPercentage: 72, // Mock value
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        pendingAmount: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
        approvedAmount: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
    }

    const handleAddExpense = () => {
        setSelectedExpense(null)
        setIsExpenseModalOpen(true)
    }

    const handleEditExpense = (expense: Expense) => {
        setSelectedExpense(expense)
        setIsExpenseModalOpen(true)
    }

    const handleDeleteExpense = async (expenseId: string) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                await expensesAPI.delete(expenseId)
                setExpenses(expenses.filter(e => e.id !== expenseId))
            } catch (error) {
                console.error('Error deleting expense:', error)
                alert('Failed to delete expense')
            }
        }
    }

    const handleSaveExpense = async (expenseData: Partial<Expense>) => {
        try {
            if (selectedExpense) {
                // Update existing
                const updated = await expensesAPI.update(selectedExpense.id, expenseData)
                setExpenses(expenses.map(e => e.id === selectedExpense.id ? updated : e))
            } else {
                // Create new
                const newExpense = await expensesAPI.create(expenseData)
                setExpenses([newExpense, ...expenses])
            }
            setIsExpenseModalOpen(false)
        } catch (error) {
            console.error('Error saving expense:', error)
            alert('Failed to save expense')
        }
    }

    const handleApproveExpense = async (expenseId: string) => {
        try {
            await expensesAPI.approve(expenseId)
            const updated = expenses.map(e =>
                e.id === expenseId
                    ? {
                        ...e,
                        status: 'approved' as const,
                        approvedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                    : e
            )
            setExpenses(updated)
        } catch (error) {
            console.error('Error approving expense:', error)
            alert('Failed to approve expense')
        }
    }

    const handleRejectExpense = async (expenseId: string) => {
        try {
            await expensesAPI.reject(expenseId)
            setExpenses(expenses.map(e =>
                e.id === expenseId
                    ? { ...e, status: 'rejected' as const, updatedAt: new Date().toISOString() }
                    : e
            ))
        } catch (error) {
            console.error('Error rejecting expense:', error)
            alert('Failed to reject expense')
        }
    }

    const handleAddCategory = () => {
        setSelectedCategory(null)
        setIsCategoryModalOpen(true)
    }

    const handleEditCategory = (category: ExpenseCategory) => {
        setSelectedCategory(category)
        setIsCategoryModalOpen(true)
    }

    const handleSaveCategory = async (categoryData: Partial<ExpenseCategory>) => {
        try {
            if (selectedCategory) {
                // Update existing
                const updated = await expenseCategoriesAPI.update(selectedCategory.id, categoryData)
                setCategories(categories.map(c => c.id === selectedCategory.id ? updated : c))
            } else {
                // Create new
                const newCategory = await expenseCategoriesAPI.create(categoryData)
                setCategories([...categories, newCategory])
            }
            setIsCategoryModalOpen(false)
        } catch (error) {
            console.error('Error saving category:', error)
            alert('Failed to save category')
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        if (confirm('Are you sure you want to delete this category? Expenses using this category will not be affected.')) {
            try {
                await expenseCategoriesAPI.delete(categoryId)
                setCategories(categories.filter(c => c.id !== categoryId))
            } catch (error) {
                console.error('Error deleting category:', error)
                alert('Failed to delete category')
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            <Head>
                <title>Expenses Management | LAMA School ERP</title>
            </Head>

            <Navbar showBackButton={true} backLink="/dashboard/accounting" />

            <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
                <Sidebar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="w-full">
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Expenses Management
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Track and manage all school expenses
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/accounting/expense-analytics')}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                📊 Analytics & Budget
                            </button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {/* Total Expenses */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Total Expenses
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            ₹{stats.totalAmount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {stats.totalExpenses} items
                                        </p>
                                    </div>
                                    <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Approval */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Pending Approval
                                        </p>
                                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                                            ₹{stats.pendingAmount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {stats.pendingApproval} items
                                        </p>
                                    </div>
                                    <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-full">
                                        <span className="text-2xl">⏳</span>
                                    </div>
                                </div>
                            </div>

                            {/* Approved This Month */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Approved This Month
                                        </p>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                                            ₹{stats.approvedAmount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {stats.approvedThisMonth} items
                                        </p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full">
                                        <span className="text-2xl">✅</span>
                                    </div>
                                </div>
                            </div>

                            {/* Budget Used */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Monthly Budget
                                        </p>
                                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                            {stats.budgetUsedPercentage}%
                                        </p>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${stats.budgetUsedPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full ml-4">
                                        <span className="text-2xl">💰</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                {/* Search */}
                                <div className="flex-1 w-full sm:max-w-md">
                                    <input
                                        type="text"
                                        placeholder="Search expenses..."
                                        value={filters.searchQuery || ''}
                                        onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        🔍 Filters
                                    </button>
                                    <button
                                        onClick={handleAddCategory}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        📁 Manage Categories
                                    </button>
                                    <button
                                        onClick={handleAddExpense}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        + Add Expense
                                    </button>
                                </div>
                            </div>

                            {/* Filters Panel */}
                            {showFilters && (
                                <ExpenseFilters
                                    filters={filters}
                                    onFiltersChange={setFilters}
                                    categories={categories}
                                />
                            )}
                        </div>

                        {/* Expenses Table */}
                        <ExpenseTable
                            expenses={filteredExpenses}
                            categories={categories}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
                            onApprove={handleApproveExpense}
                            onReject={handleRejectExpense}
                        />
                    </div>
                </main>
            </div>

            {/* Expense Modal */}
            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                expense={selectedExpense}
                categories={categories}
            />

            {/* Category Modal */}
            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={handleSaveCategory}
                category={selectedCategory}
            />
        </div>
    )
}

export default ExpensesPage
