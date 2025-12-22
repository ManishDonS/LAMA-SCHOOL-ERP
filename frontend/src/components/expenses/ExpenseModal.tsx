import React, { useState, useEffect } from 'react'
import { X, Upload, DollarSign, Calendar, FileText, Tag, AlignLeft } from 'lucide-react'
import NepaliDatePicker from '@/components/NepaliDatePicker'
import { Expense, ExpenseCategory } from './types'

interface ExpenseModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (expense: Partial<Expense>) => void
    expense: Expense | null
    categories: ExpenseCategory[]
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
    isOpen,
    onClose,
    onSave,
    expense,
    categories,
}) => {
    const [formData, setFormData] = useState<Partial<Expense>>({
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
        amount: 0,
        vendorName: '',
        paymentMethod: '',
        referenceNumber: '',
        notes: '',
        isRecurring: false,
        recurringFrequency: undefined,
        status: 'draft',
    })
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [uploadError, setUploadError] = useState('')

    useEffect(() => {
        if (expense) {
            setFormData(expense)
            setUploadedFiles([])
        } else {
            setFormData({
                expenseDate: new Date().toISOString().split('T')[0],
                description: '',
                categoryId: '',
                amount: 0,
                vendorName: '',
                paymentMethod: '',
                referenceNumber: '',
                notes: '',
                isRecurring: false,
                recurringFrequency: undefined,
                status: 'draft',
            })
        }
    }, [expense, isOpen])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent, submitForApproval: boolean = false) => {
        e.preventDefault()
        onSave({
            ...formData,
            status: submitForApproval ? 'pending' : 'draft',
        })
    }

    const handleChange = (field: keyof Expense, value: any) => {
        setFormData({ ...formData, [field]: value })
    }

    const validateFile = (file: File): boolean => {
        const maxSize = 10 * 1024 * 1024 // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

        if (!allowedTypes.includes(file.type)) {
            setUploadError('Only JPG, PNG, and PDF files are allowed')
            return false
        }

        if (file.size > maxSize) {
            setUploadError('File size must be less than 10MB')
            return false
        }

        setUploadError('')
        return true
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const validFiles = files.filter(validateFile)
        setUploadedFiles([...uploadedFiles, ...validFiles])
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        const validFiles = files.filter(validateFile)
        setUploadedFiles([...uploadedFiles, ...validFiles])
    }

    const handleRemoveFile = (index: number) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
    }

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return '🖼️'
        if (file.type === 'application/pdf') return '📄'
        return '📎'
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {expense ? 'Edit Expense' : 'Add New Expense'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Expense Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Expense Date <span className="text-red-500">*</span>
                                </label>
                                <NepaliDatePicker
                                    value={formData.expenseDate || ''}
                                    onChange={(date) => setFormData({ ...formData, expenseDate: date })}
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => handleChange('categoryId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="e.g., Monthly electricity bill"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Amount (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>

                            {/* Vendor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Vendor/Supplier
                                </label>
                                <input
                                    type="text"
                                    value={formData.vendorName}
                                    onChange={(e) => handleChange('vendorName', e.target.value)}
                                    placeholder="e.g., ABC Suppliers"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Payment Method
                                </label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select method</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Check">Check</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>

                            {/* Reference Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.referenceNumber}
                                    onChange={(e) => handleChange('referenceNumber', e.target.value)}
                                    placeholder="e.g., INV-2024-001"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            Additional Details
                        </h3>

                        {/* Notes */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Add any additional notes..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                            />
                        </div>

                        {/* Recurring Expense */}
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isRecurring}
                                    onChange={(e) => {
                                        handleChange('isRecurring', e.target.checked)
                                        if (!e.target.checked) {
                                            handleChange('recurringFrequency', undefined)
                                        }
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Recurring Expense
                                </span>
                            </label>

                            {formData.isRecurring && (
                                <select
                                    value={formData.recurringFrequency}
                                    onChange={(e) => handleChange('recurringFrequency', e.target.value)}
                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                >
                                    <option value="">Select frequency</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Receipt Upload */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            Attachments
                        </h3>

                        {/* Upload Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                                }`}
                        >
                            <input
                                type="file"
                                id="receipt-upload"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,application/pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <label htmlFor="receipt-upload" className="cursor-pointer">
                                <div className="text-4xl mb-2">📎</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    JPG, PNG, PDF (Max 10MB)
                                </p>
                            </label>
                        </div>

                        {/* Error Message */}
                        {uploadError && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {uploadError}
                            </p>
                        )}

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="text-2xl">{getFileIcon(file)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-2"
                                            title="Remove file"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
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
                        onClick={(e) => handleSubmit(e, false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Save as Draft
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Submit for Approval
                    </button>
                </div>
            </div>
        </div>
    )
}
