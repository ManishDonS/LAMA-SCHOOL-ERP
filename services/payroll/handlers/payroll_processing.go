package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"school-erp/payroll/messaging"
	"school-erp/payroll/models"

	"github.com/gofiber/fiber/v2"
)

type PayrollProcessingHandler struct {
	DB *sql.DB
}

// GeneratePayroll generates payroll for a specific month
func (h *PayrollProcessingHandler) GeneratePayroll(c *fiber.Ctx) error {
	var input struct {
		PayrollMonth string   `json:"payroll_month"`
		Department   string   `json:"department,omitempty"`
		StaffIDs     []string `json:"staff_ids,omitempty"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if input.PayrollMonth == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Payroll month is required"})
	}

	// Build query based on filters
	query := `
		SELECT staff_id, staff_name, department, position,
			   basic_salary, hra, da, ta, medical_allowance, other_allowances,
			   pf_deduction, tax_deduction, insurance_deduction, other_deductions,
			   gross_salary, net_salary
		FROM payroll_structures
		WHERE status = 'active'
	`

	args := []interface{}{}
	argCount := 1

	if input.Department != "" {
		query += fmt.Sprintf(" AND department = $%d", argCount)
		args = append(args, input.Department)
		argCount++
	}

	if len(input.StaffIDs) > 0 {
		query += fmt.Sprintf(" AND staff_id = ANY($%d)", argCount)
		args = append(args, input.StaffIDs)
	}

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		log.Printf("Error querying payroll structures: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll structures"})
	}
	defer rows.Close()

	generatedCount := 0
	skippedCount := 0
	errors := []string{}

	for rows.Next() {
		var staffID, staffName, department, position string
		var basicSalary, hra, da, ta, medicalAllowance, otherAllowances float64
		var pfDeduction, taxDeduction, insuranceDeduction, otherDeductions float64
		var grossSalary, netSalary float64

		err := rows.Scan(
			&staffID, &staffName, &department, &position,
			&basicSalary, &hra, &da, &ta, &medicalAllowance, &otherAllowances,
			&pfDeduction, &taxDeduction, &insuranceDeduction, &otherDeductions,
			&grossSalary, &netSalary,
		)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		// Check if payroll already exists for this staff and month
		var exists bool
		checkQuery := `SELECT EXISTS(SELECT 1 FROM payroll_records WHERE staff_id = $1 AND payroll_month = $2)`
		h.DB.QueryRow(checkQuery, staffID, input.PayrollMonth).Scan(&exists)

		if exists {
			skippedCount++
			continue
		}

		// Calculate total allowances and deductions
		totalAllowances := hra + da + ta + medicalAllowance + otherAllowances
		totalDeductions := pfDeduction + taxDeduction + insuranceDeduction + otherDeductions

		// Insert payroll record
		insertQuery := `
			INSERT INTO payroll_records (
				payroll_month, staff_id, staff_name, department, position,
				basic_salary, total_allowances, total_deductions,
				gross_salary, net_salary, status
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
		`

		_, err = h.DB.Exec(
			insertQuery,
			input.PayrollMonth, staffID, staffName, department, position,
			basicSalary, totalAllowances, totalDeductions,
			grossSalary, netSalary,
		)

		if err != nil {
			log.Printf("Error inserting payroll record for %s: %v", staffID, err)
			errors = append(errors, fmt.Sprintf("Failed to generate payroll for %s", staffName))
			continue
		}

		generatedCount++
	}

	// Publish event
	eventData, _ := json.Marshal(fiber.Map{
		"event":           "payroll_generated",
		"payroll_month":   input.PayrollMonth,
		"generated_count": generatedCount,
		"skipped_count":   skippedCount,
	})
	messaging.PublishEvent("payroll.generated", eventData)

	return c.JSON(fiber.Map{
		"message":         "Payroll generation completed",
		"generated_count": generatedCount,
		"skipped_count":   skippedCount,
		"errors":          errors,
	})
}

// GetPayrollRecords retrieves payroll records with filters
func (h *PayrollProcessingHandler) GetPayrollRecords(c *fiber.Ctx) error {
	month := c.Query("month")
	status := c.Query("status")
	department := c.Query("department")

	query := `
		SELECT id, payroll_month, staff_id, staff_name, department, position,
			   basic_salary, total_allowances, total_deductions, gross_salary, net_salary,
			   working_days, present_days, absent_days, leave_days,
			   overtime_hours, overtime_amount, bonus, status,
			   approved_by, approved_at, processed_by, processed_at,
			   notes, created_at, updated_at
		FROM payroll_records
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if month != "" {
		query += fmt.Sprintf(" AND payroll_month = $%d", argCount)
		args = append(args, month)
		argCount++
	}

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, status)
		argCount++
	}

	if department != "" {
		query += fmt.Sprintf(" AND department = $%d", argCount)
		args = append(args, department)
		argCount++
	}

	query += " ORDER BY created_at DESC"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll records"})
	}
	defer rows.Close()

	records := []models.PayrollRecord{}
	for rows.Next() {
		var r models.PayrollRecord
		err := rows.Scan(
			&r.ID, &r.PayrollMonth, &r.StaffID, &r.StaffName, &r.Department, &r.Position,
			&r.BasicSalary, &r.TotalAllowances, &r.TotalDeductions, &r.GrossSalary, &r.NetSalary,
			&r.WorkingDays, &r.PresentDays, &r.AbsentDays, &r.LeaveDays,
			&r.OvertimeHours, &r.OvertimeAmount, &r.Bonus, &r.Status,
			&r.ApprovedBy, &r.ApprovedAt, &r.ProcessedBy, &r.ProcessedAt,
			&r.Notes, &r.CreatedAt, &r.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		records = append(records, r)
	}

	return c.JSON(records)
}

// ApprovePayroll approves payroll records
func (h *PayrollProcessingHandler) ApprovePayroll(c *fiber.Ctx) error {
	var input struct {
		RecordIDs  []int  `json:"record_ids"`
		ApprovedBy string `json:"approved_by"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if len(input.RecordIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No records specified"})
	}

	query := `
		UPDATE payroll_records
		SET status = 'approved',
			approved_by = $1,
			approved_at = $2,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ANY($3) AND status = 'draft'
	`

	result, err := h.DB.Exec(query, input.ApprovedBy, time.Now(), input.RecordIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to approve payroll"})
	}

	rowsAffected, _ := result.RowsAffected()

	// Publish event
	eventData, _ := json.Marshal(fiber.Map{
		"event":       "payroll_approved",
		"record_ids":  input.RecordIDs,
		"approved_by": input.ApprovedBy,
		"count":       rowsAffected,
	})
	messaging.PublishEvent("payroll.approved", eventData)

	return c.JSON(fiber.Map{
		"message":        "Payroll approved successfully",
		"approved_count": rowsAffected,
	})
}

// ProcessPayroll marks payroll as processed
func (h *PayrollProcessingHandler) ProcessPayroll(c *fiber.Ctx) error {
	var input struct {
		RecordIDs   []int  `json:"record_ids"`
		ProcessedBy string `json:"processed_by"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		UPDATE payroll_records
		SET status = 'processed',
			processed_by = $1,
			processed_at = $2,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ANY($3) AND status = 'approved'
	`

	result, err := h.DB.Exec(query, input.ProcessedBy, time.Now(), input.RecordIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to process payroll"})
	}

	rowsAffected, _ := result.RowsAffected()

	// Publish event
	eventData, _ := json.Marshal(fiber.Map{
		"event":        "payroll_processed",
		"record_ids":   input.RecordIDs,
		"processed_by": input.ProcessedBy,
		"count":        rowsAffected,
	})
	messaging.PublishEvent("payroll.processed", eventData)

	return c.JSON(fiber.Map{
		"message":         "Payroll processed successfully",
		"processed_count": rowsAffected,
	})
}

// GetPayrollSummary returns summary statistics
func (h *PayrollProcessingHandler) GetPayrollSummary(c *fiber.Ctx) error {
	month := c.Query("month")

	if month == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Month parameter is required"})
	}

	query := `
		SELECT 
			COUNT(*) as total_staff,
			COALESCE(SUM(gross_salary), 0) as total_gross_salary,
			COALESCE(SUM(total_deductions), 0) as total_deductions,
			COALESCE(SUM(net_salary), 0) as total_net_salary,
			COUNT(CASE WHEN status = 'draft' THEN 1 END) as pending_approvals,
			COUNT(CASE WHEN status = 'approved' THEN 1 END) as pending_payments
		FROM payroll_records
		WHERE payroll_month = $1
	`

	var summary models.PayrollSummary
	err := h.DB.QueryRow(query, month).Scan(
		&summary.TotalStaff,
		&summary.TotalGrossSalary,
		&summary.TotalDeductions,
		&summary.TotalNetSalary,
		&summary.PendingApprovals,
		&summary.PendingPayments,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll summary"})
	}

	return c.JSON(summary)
}

// UpdatePayrollRecord updates a specific payroll record
func (h *PayrollProcessingHandler) UpdatePayrollRecord(c *fiber.Ctx) error {
	id := c.Params("id")
	var input models.PayrollRecord

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		UPDATE payroll_records
		SET working_days = $1, present_days = $2, absent_days = $3, leave_days = $4,
			overtime_hours = $5, overtime_amount = $6, bonus = $7, notes = $8,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $9
	`

	result, err := h.DB.Exec(
		query,
		input.WorkingDays, input.PresentDays, input.AbsentDays, input.LeaveDays,
		input.OvertimeHours, input.OvertimeAmount, input.Bonus, input.Notes,
		id,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update payroll record"})
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Payroll record not found"})
	}

	idInt, _ := strconv.Atoi(id)
	input.ID = idInt

	return c.JSON(input)
}
