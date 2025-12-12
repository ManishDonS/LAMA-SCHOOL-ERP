import React from 'react'
import { Expense, ExpenseCategory } from './types'

interface ExpenseTableProps {
    expenses: Expense[]
    categories: ExpenseCategory[]
    onEdit: (expense: Expense) => void
    onDelete: (expenseId: string) => void
    onApprove: (expenseId: string) => void
    onReject: (expenseId: string) => void
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
    expenses,
    categories,
    onEdit,
    onDelete,
    onApprove,
    onReject,
}) => {
    const getStatusBadge = (status: Expense['status']) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
            pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
            approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
            rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
            paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        }

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId)
        return category ? category.name : 'Unknown'
    }

    const getCategoryIcon = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId)
        return category?.icon || '📁'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    if (expenses.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
                <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No expenses found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Get started by adding your first expense
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Vendor
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {expenses.map((expense) => (
                            <tr
                                key={expense.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {formatDate(expense.expenseDate)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                    <div className="max-w-xs">
                                        <p className="font-medium truncate">{expense.description}</p>
                                        {expense.referenceNumber && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Ref: {expense.referenceNumber}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getCategoryIcon(expense.categoryId)}</span>
                                        <span className="text-gray-900 dark:text-gray-100">
                                            {getCategoryName(expense.categoryId)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {expense.vendorName || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                                    ₹{expense.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {getStatusBadge(expense.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        {expense.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => onApprove(expense.id)}
                                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                                    title="Approve"
                                                >
                                                    ✅
                                                </button>
                                                <button
                                                    onClick={() => onReject(expense.id)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Reject"
                                                >
                                                    ❌
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => onDelete(expense.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense) => (
                    <div key={expense.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{getCategoryIcon(expense.categoryId)}</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {getCategoryName(expense.categoryId)}
                                    </span>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {expense.description}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {formatDate(expense.expenseDate)}
                                </p>
                            </div>
                            {getStatusBadge(expense.status)}
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    ₹{expense.amount.toLocaleString()}
                                </p>
                                {expense.vendorName && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {expense.vendorName}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => onEdit(expense)}
                                    className="text-blue-600 dark:text-blue-400 text-xl"
                                >
                                    ✏️
                                </button>
                                {expense.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => onApprove(expense.id)}
                                            className="text-green-600 dark:text-green-400 text-xl"
                                        >
                                            ✅
                                        </button>
                                        <button
                                            onClick={() => onReject(expense.id)}
                                            className="text-red-600 dark:text-red-400 text-xl"
                                        >
                                            ❌
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => onDelete(expense.id)}
                                    className="text-red-600 dark:text-red-400 text-xl"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
