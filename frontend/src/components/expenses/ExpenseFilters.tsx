import React from 'react'
import { ExpenseFilters as Filters, ExpenseCategory } from './types'

interface ExpenseFiltersProps {
    filters: Filters
    onFiltersChange: (filters: Filters) => void
    categories: ExpenseCategory[]
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
    filters,
    onFiltersChange,
    categories,
}) => {
    const handleChange = (field: keyof Filters, value: any) => {
        onFiltersChange({ ...filters, [field]: value })
    }

    const clearFilters = () => {
        onFiltersChange({})
    }

    const hasActiveFilters = Object.keys(filters).some(key => {
        const value = filters[key as keyof Filters]
        return value !== undefined && value !== '' && key !== 'searchQuery'
    })

    return (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date From */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date From
                    </label>
                    <input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => handleChange('dateFrom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date To
                    </label>
                    <input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => handleChange('dateTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                    </label>
                    <select
                        value={filters.categoryId || ''}
                        onChange={(e) => handleChange('categoryId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                    </label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>

                {/* Min Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Min Amount (₹)
                    </label>
                    <input
                        type="number"
                        value={filters.minAmount || ''}
                        onChange={(e) => handleChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                </div>

                {/* Max Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Amount (₹)
                    </label>
                    <input
                        type="number"
                        value={filters.maxAmount || ''}
                        onChange={(e) => handleChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="999999"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    )
}
