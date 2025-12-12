import React, { useState, useEffect } from 'react'
import { ExpenseCategory } from './types'

interface CategoryModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (category: Partial<ExpenseCategory>) => void
    category: ExpenseCategory | null
}

const CATEGORY_ICONS = ['⚡', '💵', '📦', '🔧', '🚌', '🏫', '📚', '🍽️', '💡', '🏥', '🎨', '⚽', '🎭', '🔬', '💻', '📱', '🖨️', '🪑', '🧹', '🔑']
const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16']

export const CategoryModal: React.FC<CategoryModalProps> = ({
    isOpen,
    onClose,
    onSave,
    category,
}) => {
    const [formData, setFormData] = useState<Partial<ExpenseCategory>>({
        name: '',
        description: '',
        budgetMonthly: 0,
        budgetYearly: 0,
        color: CATEGORY_COLORS[0],
        icon: CATEGORY_ICONS[0],
        isActive: true,
    })

    useEffect(() => {
        if (category) {
            setFormData(category)
        } else {
            setFormData({
                name: '',
                description: '',
                budgetMonthly: 0,
                budgetYearly: 0,
                color: CATEGORY_COLORS[0],
                icon: CATEGORY_ICONS[0],
                isActive: true,
            })
        }
    }, [category, isOpen])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
    }

    const handleChange = (field: keyof ExpenseCategory, value: any) => {
        setFormData({ ...formData, [field]: value })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {category ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Category Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Category Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g., Office Supplies"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Brief description of this category..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                        />
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Icon
                        </label>
                        <div className="grid grid-cols-10 gap-2">
                            {CATEGORY_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => handleChange('icon', icon)}
                                    className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                                        formData.icon === icon
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                                    }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Color
                        </label>
                        <div className="flex gap-2">
                            {CATEGORY_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => handleChange('color', color)}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                        formData.color === color
                                            ? 'border-gray-900 dark:border-white scale-110'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Budget Allocation */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Monthly Budget (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.budgetMonthly}
                                onChange={(e) => handleChange('budgetMonthly', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                step="100"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Yearly Budget (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.budgetYearly}
                                onChange={(e) => handleChange('budgetYearly', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                step="1000"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                style={{ backgroundColor: formData.color + '20' }}
                            >
                                {formData.icon}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formData.name || 'Category Name'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formData.description || 'No description'}
                                </p>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {category ? 'Update Category' : 'Create Category'}
                    </button>
                </div>
            </div>
        </div>
    )
}
