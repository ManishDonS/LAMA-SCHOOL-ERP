// Expense Management Types

export interface Expense {
    id: string
    schoolId: string
    categoryId: string
    departmentId?: string
    expenseDate: string
    description: string
    amount: number
    currency: string
    vendorName?: string
    paymentMethod?: string
    referenceNumber?: string
    notes?: string
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid'
    isRecurring: boolean
    recurringFrequency?: 'monthly' | 'yearly'
    createdBy: string
    approvedBy?: string
    approvedAt?: string
    paidAt?: string
    createdAt: string
    updatedAt: string
    receipts?: ExpenseReceipt[]
    category?: ExpenseCategory
    approvals?: ExpenseApproval[]
}

export interface ExpenseCategory {
    id: string
    schoolId: string
    name: string
    description?: string
    parentCategoryId?: string
    budgetMonthly?: number
    budgetYearly?: number
    color?: string
    icon?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface ExpenseReceipt {
    id: string
    expenseId: string
    fileName: string
    filePath: string
    fileType: string
    fileSize: number
    uploadedBy: string
    uploadedAt: string
}

export interface ExpenseApproval {
    id: string
    expenseId: string
    approverId: string
    approvalLevel: number
    status: 'pending' | 'approved' | 'rejected'
    comments?: string
    approvedAt?: string
    createdAt: string
}

export interface BudgetAllocation {
    id: string
    schoolId: string
    categoryId: string
    departmentId?: string
    fiscalYear: number
    month: number
    allocatedAmount: number
    spentAmount: number
    createdAt: string
    updatedAt: string
}

export interface ExpenseFilters {
    dateFrom?: string
    dateTo?: string
    categoryId?: string
    status?: string
    departmentId?: string
    minAmount?: number
    maxAmount?: number
    searchQuery?: string
}

export interface ExpenseStats {
    totalExpenses: number
    pendingApproval: number
    approvedThisMonth: number
    budgetUsedPercentage: number
    totalAmount: number
    pendingAmount: number
    approvedAmount: number
}

// Mock data for development
export const MOCK_CATEGORIES: ExpenseCategory[] = [
    {
        id: 'cat1',
        schoolId: 'school1',
        name: 'Utilities',
        description: 'Electricity, water, internet, etc.',
        budgetMonthly: 50000,
        budgetYearly: 600000,
        color: '#3B82F6',
        icon: '⚡',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'cat2',
        schoolId: 'school1',
        name: 'Salaries',
        description: 'Staff and teacher salaries',
        budgetMonthly: 200000,
        budgetYearly: 2400000,
        color: '#10B981',
        icon: '💵',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'cat3',
        schoolId: 'school1',
        name: 'Supplies',
        description: 'Office and classroom supplies',
        budgetMonthly: 30000,
        budgetYearly: 360000,
        color: '#F59E0B',
        icon: '📦',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'cat4',
        schoolId: 'school1',
        name: 'Maintenance',
        description: 'Building and equipment maintenance',
        budgetMonthly: 20000,
        budgetYearly: 240000,
        color: '#EF4444',
        icon: '🔧',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'cat5',
        schoolId: 'school1',
        name: 'Transport',
        description: 'School bus fuel and maintenance',
        budgetMonthly: 25000,
        budgetYearly: 300000,
        color: '#8B5CF6',
        icon: '🚌',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
]

export const MOCK_EXPENSES: Expense[] = [
    {
        id: 'exp1',
        schoolId: 'school1',
        categoryId: 'cat1',
        expenseDate: '2024-12-10',
        description: 'Monthly electricity bill',
        amount: 15000,
        currency: 'INR',
        vendorName: 'State Electricity Board',
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'EB-2024-12',
        status: 'approved',
        isRecurring: true,
        recurringFrequency: 'monthly',
        createdBy: 'user1',
        approvedBy: 'admin1',
        approvedAt: '2024-12-11T10:30:00Z',
        createdAt: '2024-12-10T09:00:00Z',
        updatedAt: '2024-12-11T10:30:00Z',
    },
    {
        id: 'exp2',
        schoolId: 'school1',
        categoryId: 'cat3',
        expenseDate: '2024-12-09',
        description: 'Classroom stationery supplies',
        amount: 8500,
        currency: 'INR',
        vendorName: 'ABC Stationers',
        paymentMethod: 'Cash',
        status: 'pending',
        isRecurring: false,
        createdBy: 'user2',
        createdAt: '2024-12-09T14:20:00Z',
        updatedAt: '2024-12-09T14:20:00Z',
    },
    {
        id: 'exp3',
        schoolId: 'school1',
        categoryId: 'cat4',
        expenseDate: '2024-12-08',
        description: 'AC repair in staff room',
        amount: 12000,
        currency: 'INR',
        vendorName: 'Cool Air Services',
        paymentMethod: 'Check',
        referenceNumber: 'CHK-001234',
        status: 'paid',
        isRecurring: false,
        createdBy: 'user1',
        approvedBy: 'admin1',
        approvedAt: '2024-12-08T16:00:00Z',
        paidAt: '2024-12-09T11:00:00Z',
        createdAt: '2024-12-08T15:00:00Z',
        updatedAt: '2024-12-09T11:00:00Z',
    },
]
