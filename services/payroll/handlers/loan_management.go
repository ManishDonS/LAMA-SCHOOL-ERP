package handlers

import (
	"database/sql"
	"log"

	"github.com/gofiber/fiber/v2"
)

type LoanHandler struct {
	DB *sql.DB
}

// CreateLoan creates a new staff loan
func (h *LoanHandler) CreateLoan(c *fiber.Ctx) error {
	var input struct {
		StaffID           string  `json:"staff_id"`
		StaffName         string  `json:"staff_name"`
		LoanAmount        float64 `json:"loan_amount"`
		InterestRate      float64 `json:"interest_rate"`
		TotalInstallments int     `json:"total_installments"`
		LoanDate          string  `json:"loan_date"`
		Notes             string  `json:"notes"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Calculate EMI (simple interest)
	totalAmount := input.LoanAmount + (input.LoanAmount * input.InterestRate / 100)
	emiAmount := totalAmount / float64(input.TotalInstallments)

	query := `
		INSERT INTO staff_loans (
			staff_id, staff_name, loan_amount, interest_rate,
			emi_amount, total_installments, outstanding_balance,
			loan_date, status, notes
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
		RETURNING id
	`

	var loanID int
	err := h.DB.QueryRow(
		query,
		input.StaffID, input.StaffName, input.LoanAmount, input.InterestRate,
		emiAmount, input.TotalInstallments, totalAmount,
		input.LoanDate, input.Notes,
	).Scan(&loanID)

	if err != nil {
		log.Printf("Error creating loan: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create loan"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message":            "Loan created successfully",
		"loan_id":            loanID,
		"emi_amount":         emiAmount,
		"total_amount":       totalAmount,
		"total_installments": input.TotalInstallments,
	})
}

// ApproveLoan approves a pending loan
func (h *LoanHandler) ApproveLoan(c *fiber.Ctx) error {
	loanID := c.Params("id")
	approvedBy := c.Query("approved_by", "admin")

	query := `
		UPDATE staff_loans
		SET status = 'active', approved_by = $1, approved_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND status = 'pending'
	`

	result, err := h.DB.Exec(query, approvedBy, loanID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to approve loan"})
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Loan not found or already approved"})
	}

	return c.JSON(fiber.Map{"message": "Loan approved successfully"})
}

// GetStaffLoans retrieves all loans for a staff member
func (h *LoanHandler) GetStaffLoans(c *fiber.Ctx) error {
	staffID := c.Params("staffId")

	query := `
		SELECT 
			id, loan_amount, interest_rate, emi_amount,
			total_installments, paid_installments, outstanding_balance,
			loan_date, status, approved_by, approved_at, notes, created_at
		FROM staff_loans
		WHERE staff_id = $1
		ORDER BY created_at DESC
	`

	rows, err := h.DB.Query(query, staffID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch loans"})
	}
	defer rows.Close()

	var loans []map[string]interface{}
	for rows.Next() {
		var id, totalInst, paidInst int
		var loanAmt, intRate, emiAmt, outBal float64
		var loanDate, status, notes string
		var approvedBy sql.NullString
		var approvedAt sql.NullTime
		var createdAt string

		rows.Scan(&id, &loanAmt, &intRate, &emiAmt, &totalInst, &paidInst, &outBal,
			&loanDate, &status, &approvedBy, &approvedAt, &notes, &createdAt)

		loans = append(loans, map[string]interface{}{
			"id":                  id,
			"loan_amount":         loanAmt,
			"interest_rate":       intRate,
			"emi_amount":          emiAmt,
			"total_installments":  totalInst,
			"paid_installments":   paidInst,
			"outstanding_balance": outBal,
			"loan_date":           loanDate,
			"status":              status,
			"approved_by":         approvedBy.String,
			"notes":               notes,
		})
	}

	return c.JSON(loans)
}

// ProcessLoanEMI processes EMI deduction during payroll
func (h *LoanHandler) ProcessLoanEMI(c *fiber.Ctx) error {
	var input struct {
		PayrollRecordID int    `json:"payroll_record_id"`
		StaffID         string `json:"staff_id"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Get active loans for staff
	query := `
		SELECT id, emi_amount, outstanding_balance, paid_installments, total_installments
		FROM staff_loans
		WHERE staff_id = $1 AND status = 'active' AND outstanding_balance > 0
		ORDER BY loan_date
	`

	rows, err := h.DB.Query(query, input.StaffID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch loans"})
	}
	defer rows.Close()

	totalEMI := 0.0
	var repayments []map[string]interface{}

	for rows.Next() {
		var loanID, paidInst, totalInst int
		var emiAmt, outBal float64

		rows.Scan(&loanID, &emiAmt, &outBal, &paidInst, &totalInst)

		// Deduct EMI
		repaymentAmt := emiAmt
		if repaymentAmt > outBal {
			repaymentAmt = outBal
		}

		newBalance := outBal - repaymentAmt
		newPaidInst := paidInst + 1

		// Update loan
		updateQuery := `
			UPDATE staff_loans
			SET outstanding_balance = $1, paid_installments = $2,
				status = CASE WHEN $1 <= 0 THEN 'completed' ELSE 'active' END,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $3
		`
		h.DB.Exec(updateQuery, newBalance, newPaidInst, loanID)

		// Record repayment
		repayQuery := `
			INSERT INTO loan_repayments (
				loan_id, payroll_record_id, repayment_amount,
				repayment_date, remaining_balance
			) VALUES ($1, $2, $3, CURRENT_DATE, $4)
		`
		h.DB.Exec(repayQuery, loanID, input.PayrollRecordID, repaymentAmt, newBalance)

		totalEMI += repaymentAmt
		repayments = append(repayments, map[string]interface{}{
			"loan_id":           loanID,
			"repayment_amount":  repaymentAmt,
			"remaining_balance": newBalance,
		})
	}

	return c.JSON(fiber.Map{
		"message":           "Loan EMI processed successfully",
		"total_emi":         totalEMI,
		"repayments":        repayments,
		"payroll_record_id": input.PayrollRecordID,
	})
}

// GetLoanSummary gets loan summary for reporting
func (h *LoanHandler) GetLoanSummary(c *fiber.Ctx) error {
	query := `
		SELECT 
			COUNT(*) as total_loans,
			COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_loans,
			COALESCE(SUM(CASE WHEN status = 'active' THEN outstanding_balance ELSE 0 END), 0) as total_outstanding,
			COALESCE(SUM(loan_amount), 0) as total_disbursed
		FROM staff_loans
	`

	var summary struct {
		TotalLoans       int
		ActiveLoans      int
		CompletedLoans   int
		TotalOutstanding float64
		TotalDisbursed   float64
	}

	err := h.DB.QueryRow(query).Scan(
		&summary.TotalLoans,
		&summary.ActiveLoans,
		&summary.CompletedLoans,
		&summary.TotalOutstanding,
		&summary.TotalDisbursed,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch loan summary"})
	}

	return c.JSON(summary)
}
