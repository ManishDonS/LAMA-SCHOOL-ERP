// API Service for Expenses Management mapping to centralized api.ts
import { expenseAPI } from './api'

// ==================== CATEGORIES ====================

export const expenseCategoriesAPI = {
    // Get all categories
    getAll: async (_schoolId?: string) => {
        const response = await expenseAPI.listCategories()
        return response.data
    },

    // Create category
    create: async (data: any, _schoolId?: string) => {
        const response = await expenseAPI.createCategory(data)
        return response.data
    },

    // Update category
    update: async (id: string, data: any) => {
        const response = await expenseAPI.updateCategory(id, data)
        return response.data
    },

    // Delete category
    delete: async (id: string) => {
        const response = await expenseAPI.deleteCategory(id)
        return response.data
    },
}

// ==================== EXPENSES ====================

export const expensesAPI = {
    // Get all expenses
    getAll: async (_schoolId?: string, filters?: any) => {
        const response = await expenseAPI.list(filters)
        return response.data
    },

    // Get single expense
    get: async (id: string) => {
        const response = await expenseAPI.get(id)
        return response.data
    },

    // Create expense
    create: async (data: any, _schoolId?: string) => {
        const response = await expenseAPI.create(data)
        return response.data
    },

    // Update expense
    update: async (id: string, data: any) => {
        const response = await expenseAPI.update(id, data)
        return response.data
    },

    // Delete expense
    delete: async (id: string) => {
        const response = await expenseAPI.delete(id)
        return response.data
    },

    // Approve expense
    approve: async (id: string) => {
        const response = await expenseAPI.approve(id)
        return response.data
    },

    // Reject expense
    reject: async (id: string) => {
        const response = await expenseAPI.reject(id)
        return response.data
    },

    // Analytics & Budget
    getAnalytics: async (params?: any) => {
        const response = await expenseAPI.getAnalytics(params)
        return response.data
    },

    getBudgetStatus: async (params?: any) => {
        const response = await expenseAPI.getBudgetStatus(params)
        return response.data
    },
}

// ==================== FILE UPLOAD ====================

export const expenseFilesAPI = {
    // Upload receipt
    uploadReceipt: async (expenseId: string, file: File) => {
        const response = await expenseAPI.uploadReceipt(expenseId, file)
        return response.data
    },

    // List receipts
    listReceipts: async (expenseId: string) => {
        const response = await expenseAPI.listReceipts(expenseId)
        return response.data
    },

    // Delete receipt
    deleteReceipt: async (expenseId: string, receiptId: string) => {
        const response = await expenseAPI.deleteReceipt(expenseId, receiptId)
        return response.data
    }
}
