package models

import "time"

// PayrollStructure represents the salary structure for a staff member
type PayrollStructure struct {
	ID                 int       `json:"id"`
	StaffID            string    `json:"staff_id"`
	StaffName          string    `json:"staff_name"`
	StaffEmail         string    `json:"staff_email"`
	Department         string    `json:"department"`
	Position           string    `json:"position"`
	BasicSalary        float64   `json:"basic_salary"`
	HRA                float64   `json:"hra"`
	DA                 float64   `json:"da"`
	TA                 float64   `json:"ta"`
	MedicalAllowance   float64   `json:"medical_allowance"`
	OtherAllowances    float64   `json:"other_allowances"`
	PFDeduction        float64   `json:"pf_deduction"`
	TaxDeduction       float64   `json:"tax_deduction"`
	InsuranceDeduction float64   `json:"insurance_deduction"`
	OtherDeductions    float64   `json:"other_deductions"`
	GrossSalary        float64   `json:"gross_salary"`
	NetSalary          float64   `json:"net_salary"`
	EffectiveFrom      string    `json:"effective_from"`
	EffectiveTo        *string   `json:"effective_to,omitempty"`
	Status             string    `json:"status"`
	Notes              string    `json:"notes,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// PayrollRecord represents a monthly payroll record
type PayrollRecord struct {
	ID              int        `json:"id"`
	PayrollMonth    string     `json:"payroll_month"`
	StaffID         string     `json:"staff_id"`
	StaffName       string     `json:"staff_name"`
	Department      string     `json:"department"`
	Position        string     `json:"position"`
	BasicSalary     float64    `json:"basic_salary"`
	TotalAllowances float64    `json:"total_allowances"`
	TotalDeductions float64    `json:"total_deductions"`
	GrossSalary     float64    `json:"gross_salary"`
	NetSalary       float64    `json:"net_salary"`
	WorkingDays     int        `json:"working_days"`
	PresentDays     int        `json:"present_days"`
	AbsentDays      int        `json:"absent_days"`
	LeaveDays       int        `json:"leave_days"`
	OvertimeHours   float64    `json:"overtime_hours"`
	OvertimeAmount  float64    `json:"overtime_amount"`
	Bonus           float64    `json:"bonus"`
	Status          string     `json:"status"`
	ApprovedBy      *string    `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
	ProcessedBy     *string    `json:"processed_by,omitempty"`
	ProcessedAt     *time.Time `json:"processed_at,omitempty"`
	Notes           string     `json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// PayrollPayment represents a payment transaction
type PayrollPayment struct {
	ID               int       `json:"id"`
	PayrollRecordID  int       `json:"payroll_record_id"`
	StaffID          string    `json:"staff_id"`
	StaffName        string    `json:"staff_name"`
	PayrollMonth     string    `json:"payroll_month"`
	Amount           float64   `json:"amount"`
	PaymentMethod    string    `json:"payment_method"`
	PaymentReference string    `json:"payment_reference,omitempty"`
	PaymentDate      *string   `json:"payment_date,omitempty"`
	Status           string    `json:"status"`
	BankName         string    `json:"bank_name,omitempty"`
	AccountNumber    string    `json:"account_number,omitempty"`
	Notes            string    `json:"notes,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// SalarySlip represents a generated salary slip
type SalarySlip struct {
	ID              int        `json:"id"`
	PayrollRecordID int        `json:"payroll_record_id"`
	StaffID         string     `json:"staff_id"`
	StaffName       string     `json:"staff_name"`
	StaffEmail      string     `json:"staff_email"`
	PayrollMonth    string     `json:"payroll_month"`
	SlipNumber      string     `json:"slip_number"`
	GeneratedAt     time.Time  `json:"generated_at"`
	SentAt          *time.Time `json:"sent_at,omitempty"`
	Status          string     `json:"status"`
	PDFPath         string     `json:"pdf_path,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// PayrollSummary represents aggregated payroll statistics
type PayrollSummary struct {
	TotalStaff       int     `json:"total_staff"`
	TotalGrossSalary float64 `json:"total_gross_salary"`
	TotalDeductions  float64 `json:"total_deductions"`
	TotalNetSalary   float64 `json:"total_net_salary"`
	PendingApprovals int     `json:"pending_approvals"`
	PendingPayments  int     `json:"pending_payments"`
}

// DepartmentSalary represents department-wise salary summary
type DepartmentSalary struct {
	Department    string  `json:"department"`
	StaffCount    int     `json:"staff_count"`
	TotalSalary   float64 `json:"total_salary"`
	AverageSalary float64 `json:"average_salary"`
}
