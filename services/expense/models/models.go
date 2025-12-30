package models

import (
	"time"
)

type ExpenseCategory struct {
	ID               string    `json:"id"`
	SchoolID         string    `json:"schoolId"`
	Name             string    `json:"name"`
	Description      *string   `json:"description"`
	ParentCategoryID *string   `json:"parentCategoryId"`
	BudgetMonthly    *float64  `json:"budgetMonthly"`
	BudgetYearly     *float64  `json:"budgetYearly"`
	Color            *string   `json:"color"`
	Icon             *string   `json:"icon"`
	IsActive         bool      `json:"isActive"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type Expense struct {
	ID                 string     `json:"id"`
	SchoolID           string     `json:"schoolId"`
	CategoryID         *string    `json:"categoryId"`
	DepartmentID       *string    `json:"departmentId"`
	ExpenseDate        time.Time  `json:"expenseDate"`
	Description        string     `json:"description"`
	Amount             float64    `json:"amount"`
	Currency           string     `json:"currency"`
	VendorName         *string    `json:"vendorName"`
	PaymentMethod      *string    `json:"paymentMethod"`
	ReferenceNumber    *string    `json:"referenceNumber"`
	Notes              *string    `json:"notes"`
	Status             string     `json:"status"`
	IsRecurring        bool       `json:"isRecurring"`
	RecurringFrequency *string    `json:"recurringFrequency"`
	CreatedBy          string     `json:"createdBy"`
	ApprovedBy         *string    `json:"approvedBy"`
	ApprovedAt         *time.Time `json:"approvedAt"`
	PaidAt             *time.Time `json:"paidAt"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`

	// Joined data
	Category  *ExpenseCategory  `json:"category,omitempty"`
	Receipts  []ExpenseReceipt  `json:"receipts,omitempty"`
	Approvals []ExpenseApproval `json:"approvals,omitempty"`
}

type ExpenseReceipt struct {
	ID         string    `json:"id"`
	ExpenseID  string    `json:"expenseId"`
	FileName   string    `json:"fileName"`
	FilePath   string    `json:"filePath"`
	FileType   string    `json:"fileType"`
	FileSize   int       `json:"fileSize"`
	UploadedBy string    `json:"uploadedBy"`
	UploadedAt time.Time `json:"uploadedAt"`
}

type ExpenseApproval struct {
	ID            string     `json:"id"`
	ExpenseID     string     `json:"expenseId"`
	ApproverID    string     `json:"approverId"`
	ApprovalLevel int        `json:"approvalLevel"`
	Status        string     `json:"status"`
	Comments      *string    `json:"comments"`
	ApprovedAt    *time.Time `json:"approvedAt"`
	CreatedAt     time.Time  `json:"createdAt"`
}

type BudgetAllocation struct {
	ID              string    `json:"id"`
	SchoolID        string    `json:"schoolId"`
	CategoryID      string    `json:"categoryId"`
	DepartmentID    *string   `json:"departmentId"`
	FiscalYear      int       `json:"fiscalYear"`
	Month           int       `json:"month"`
	AllocatedAmount float64   `json:"allocatedAmount"`
	SpentAmount     float64   `json:"spentAmount"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type ExpenseComment struct {
	ID        string    `json:"id"`
	ExpenseID string    `json:"expenseId"`
	UserID    string    `json:"userId"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"createdAt"`
}

// Request/Response DTOs
type CreateExpenseRequest struct {
	CategoryID         *string `json:"categoryId"`
	ExpenseDate        string  `json:"expenseDate"`
	Description        string  `json:"description"`
	Amount             float64 `json:"amount"`
	VendorName         *string `json:"vendorName"`
	PaymentMethod      *string `json:"paymentMethod"`
	ReferenceNumber    *string `json:"referenceNumber"`
	Notes              *string `json:"notes"`
	IsRecurring        bool    `json:"isRecurring"`
	RecurringFrequency *string `json:"recurringFrequency"`
	Status             string  `json:"status"`
}

type CreateCategoryRequest struct {
	Name          string   `json:"name"`
	Description   *string  `json:"description"`
	BudgetMonthly *float64 `json:"budgetMonthly"`
	BudgetYearly  *float64 `json:"budgetYearly"`
	Color         *string  `json:"color"`
	Icon          *string  `json:"icon"`
}

type ExpenseFilters struct {
	DateFrom   *string  `json:"dateFrom"`
	DateTo     *string  `json:"dateTo"`
	CategoryID *string  `json:"categoryId"`
	Status     *string  `json:"status"`
	MinAmount  *float64 `json:"minAmount"`
	MaxAmount  *float64 `json:"maxAmount"`
	Search     *string  `json:"search"`
}
