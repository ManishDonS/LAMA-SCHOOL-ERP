// API Service for Expenses Management

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const EXPENSE_SERVICE_URL = `${API_BASE_URL}/expense-service/api/v1`

// Helper function to get auth token
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token') || ''
    }
    return ''
}

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
    const token = getAuthToken()
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    }

    const response = await fetch(`${EXPENSE_SERVICE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
}

// ==================== CATEGORIES ====================

export const expenseCategoriesAPI = {
    // Get all categories
    getAll: async (schoolId: string = '1') => {
        return apiCall(`/categories?schoolId=${schoolId}`)
    },

    // Create category
    create: async (data: any, schoolId: string = '1') => {
        return apiCall(`/categories?schoolId=${schoolId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // Update category
    update: async (id: string, data: any) => {
        return apiCall(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    },

    // Delete category
    delete: async (id: string) => {
        return apiCall(`/categories/${id}`, {
            method: 'DELETE',
        })
    },
}

// ==================== EXPENSES ====================

export const expensesAPI = {
    // Get all expenses
    getAll: async (schoolId: string = '1', filters?: any) => {
        const params = new URLSearchParams({ schoolId, ...filters })
        return apiCall(`/expenses?${params.toString()}`)
    },

    // Get single expense
    get: async (id: string) => {
        return apiCall(`/expenses/${id}`)
    },

    // Create expense
    create: async (data: any, schoolId: string = '1') => {
        return apiCall(`/expenses?schoolId=${schoolId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // Update expense
    update: async (id: string, data: any) => {
        return apiCall(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    },

    // Delete expense
    delete: async (id: string) => {
        return apiCall(`/expenses/${id}`, {
            method: 'DELETE',
        })
    },

    // Approve expense
    approve: async (id: string) => {
        return apiCall(`/expenses/${id}/approve`, {
            method: 'POST',
        })
    },

    // Reject expense
    reject: async (id: string) => {
        return apiCall(`/expenses/${id}/reject`, {
            method: 'POST',
        })
    },
}

// ==================== FILE UPLOAD ====================

export const expenseFilesAPI = {
    // Upload receipt (to be implemented with multipart/form-data)
    uploadReceipt: async (expenseId: string, file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('expenseId', expenseId)

        const token = getAuthToken()
        const response = await fetch(`${EXPENSE_SERVICE_URL}/expenses/${expenseId}/receipts`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        })

        if (!response.ok) {
            throw new Error('File upload failed')
        }

        return response.json()
    },
}
