package database

import "time"

// Account represents a financial account in the chart of accounts
type Account struct {
	ID             int64      `json:"id" db:"id"`
	Code           string     `json:"code" db:"code"`
	Name           string     `json:"name" db:"name"`
	Type           string     `json:"type" db:"type"`
	ParentID       *int64     `json:"parent_id" db:"parent_id"`
	ParentCode     *string    `json:"parent_code,omitempty" db:"parent_code"`
	ParentName     *string    `json:"parent_name,omitempty" db:"parent_name"`
	Description    string     `json:"description" db:"description"`
	Balance        float64    `json:"balance" db:"balance"`
	OpeningBalance float64    `json:"opening_balance" db:"opening_balance"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	Level          int        `json:"level" db:"level"`
	SchoolID       int64      `json:"school_id" db:"school_id"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
	Children       []*Account `json:"children,omitempty" db:"-"`
}

// AccountTransaction represents a transaction for an account
type AccountTransaction struct {
	ID            int64     `json:"id" db:"id"`
	AccountID     int64     `json:"account_id" db:"account_id"`
	AccountCode   string    `json:"account_code,omitempty" db:"account_code"`
	AccountName   string    `json:"account_name,omitempty" db:"account_name"`
	Date          time.Time `json:"date" db:"date"`
	Description   string    `json:"description" db:"description"`
	DebitAmount   float64   `json:"debit_amount" db:"debit_amount"`
	CreditAmount  float64   `json:"credit_amount" db:"credit_amount"`
	Balance       float64   `json:"balance" db:"balance"`
	ReferenceType string    `json:"reference_type" db:"reference_type"`
	ReferenceID   *int64    `json:"reference_id" db:"reference_id"`
	CreatedBy     int64     `json:"created_by" db:"created_by"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// AccountAnalytics represents analytics data for the dashboard
type AccountAnalytics struct {
	TotalAssets      float64            `json:"total_assets"`
	TotalLiabilities float64            `json:"total_liabilities"`
	TotalEquity      float64            `json:"total_equity"`
	TotalRevenue     float64            `json:"total_revenue"`
	TotalExpenses    float64            `json:"total_expenses"`
	NetIncome        float64            `json:"net_income"`
	TypeDistribution map[string]float64 `json:"type_distribution"`
	AccountCount     map[string]int     `json:"account_count"`
}

// CreateAccountRequest represents the request to create a new account
type CreateAccountRequest struct {
	Code           string  `json:"code" validate:"required"`
	Name           string  `json:"name" validate:"required"`
	Type           string  `json:"type" validate:"required,oneof=Asset Liability Equity Revenue Expense"`
	ParentID       *int64  `json:"parent_id"`
	Description    string  `json:"description"`
	OpeningBalance float64 `json:"opening_balance"`
	IsActive       bool    `json:"is_active"`
	SchoolID       int64   `json:"school_id" validate:"required"`
}

// UpdateAccountRequest represents the request to update an account
type UpdateAccountRequest struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Type        string `json:"type" validate:"omitempty,oneof=Asset Liability Equity Revenue Expense"`
	ParentID    *int64 `json:"parent_id"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

// AuditLog represents an audit log entry
type AuditLog struct {
	ID        int64     `json:"id" db:"id"`
	UserID    int64     `json:"user_id" db:"user_id"`
	Action    string    `json:"action" db:"action"`
	Entity    string    `json:"entity" db:"entity"`
	EntityID  int64     `json:"entity_id" db:"entity_id"`
	Details   string    `json:"details" db:"details"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// AccountTemplate represents a pre-configured chart of accounts structure
type AccountTemplate struct {
	ID          int64                 `json:"id" db:"id"`
	Name        string                `json:"name" db:"name"`
	Description string                `json:"description" db:"description"`
	Type        string                `json:"type" db:"type"` // e.g., "K-12", "University", "Training Center"
	Items       []AccountTemplateItem `json:"items,omitempty" db:"-"`
	CreatedAt   time.Time             `json:"created_at" db:"created_at"`
}

// AccountTemplateItem represents a single account in a template
type AccountTemplateItem struct {
	ID          int64   `json:"id" db:"id"`
	TemplateID  int64   `json:"template_id" db:"template_id"`
	Code        string  `json:"code" db:"code"`
	Name        string  `json:"name" db:"name"`
	Type        string  `json:"type" db:"type"`
	ParentCode  *string `json:"parent_code" db:"parent_code"` // Used to map hierarchy within template
	Description string  `json:"description" db:"description"`
}

// AccountBudget represents a budget allocation for an account
type AccountBudget struct {
	ID         int64     `json:"id" db:"id"`
	AccountID  int64     `json:"account_id" db:"account_id"`
	FiscalYear int       `json:"fiscal_year" db:"fiscal_year"`
	Amount     float64   `json:"amount" db:"amount"`
	Notes      string    `json:"notes" db:"notes"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// Reconciliation represents a bank reconciliation session
type Reconciliation struct {
	ID              int64     `json:"id" db:"id"`
	AccountID       int64     `json:"account_id" db:"account_id"`
	StatementDate   string    `json:"statement_date" db:"statement_date"` // YYYY-MM-DD
	StartingBalance float64   `json:"starting_balance" db:"starting_balance"`
	EndingBalance   float64   `json:"ending_balance" db:"ending_balance"`
	Status          string    `json:"status" db:"status"`
	Notes           string    `json:"notes" db:"notes"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}
