package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"school-erp/payroll/messaging"
	"school-erp/payroll/models"

	"github.com/gofiber/fiber/v2"
)

type SalarySlipHandler struct {
	DB *sql.DB
}

// GenerateSalarySlips generates salary slips for payroll records
func (h *SalarySlipHandler) GenerateSalarySlips(c *fiber.Ctx) error {
	var input struct {
		RecordIDs []int `json:"record_ids"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if len(input.RecordIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No records specified"})
	}

	generatedCount := 0
	errors := []string{}

	for _, recordID := range input.RecordIDs {
		// Get payroll record details
		var staffID, staffName, staffEmail, payrollMonth string
		query := `
			SELECT pr.staff_id, pr.staff_name, ps.staff_email, pr.payroll_month
			FROM payroll_records pr
			LEFT JOIN payroll_structures ps ON pr.staff_id = ps.staff_id
			WHERE pr.id = $1 AND pr.status IN ('approved', 'processed')
		`

		err := h.DB.QueryRow(query, recordID).Scan(&staffID, &staffName, &staffEmail, &payrollMonth)
		if err == sql.ErrNoRows {
			errors = append(errors, fmt.Sprintf("Record %d not found or not approved", recordID))
			continue
		}
		if err != nil {
			log.Printf("Error fetching record %d: %v", recordID, err)
			errors = append(errors, fmt.Sprintf("Failed to fetch record %d", recordID))
			continue
		}

		// Check if slip already exists
		var exists bool
		checkQuery := `SELECT EXISTS(SELECT 1 FROM salary_slips WHERE payroll_record_id = $1)`
		h.DB.QueryRow(checkQuery, recordID).Scan(&exists)

		if exists {
			errors = append(errors, fmt.Sprintf("Salary slip already exists for record %d", recordID))
			continue
		}

		// Generate slip number
		slipNumber := fmt.Sprintf("SLIP-%s-%s-%d", payrollMonth, staffID, time.Now().Unix())

		// Insert salary slip
		insertQuery := `
			INSERT INTO salary_slips (
				payroll_record_id, staff_id, staff_name, staff_email,
				payroll_month, slip_number, status
			) VALUES ($1, $2, $3, $4, $5, $6, 'generated')
		`

		_, err = h.DB.Exec(insertQuery, recordID, staffID, staffName, staffEmail, payrollMonth, slipNumber)
		if err != nil {
			log.Printf("Error generating slip for record %d: %v", recordID, err)
			errors = append(errors, fmt.Sprintf("Failed to generate slip for record %d", recordID))
			continue
		}

		generatedCount++
	}

	// Publish event
	eventData, _ := json.Marshal(fiber.Map{
		"event":           "salary_slips_generated",
		"generated_count": generatedCount,
	})
	messaging.PublishEvent("payroll.slips.generated", eventData)

	return c.JSON(fiber.Map{
		"message":         "Salary slip generation completed",
		"generated_count": generatedCount,
		"errors":          errors,
	})
}

// GetSalarySlips retrieves salary slips with filters
func (h *SalarySlipHandler) GetSalarySlips(c *fiber.Ctx) error {
	month := c.Query("month")
	staffID := c.Query("staff_id")

	query := `
		SELECT id, payroll_record_id, staff_id, staff_name, staff_email,
			   payroll_month, slip_number, generated_at, sent_at, status, pdf_path, created_at
		FROM salary_slips
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if month != "" {
		query += fmt.Sprintf(" AND payroll_month = $%d", argCount)
		args = append(args, month)
		argCount++
	}

	if staffID != "" {
		query += fmt.Sprintf(" AND staff_id = $%d", argCount)
		args = append(args, staffID)
	}

	query += " ORDER BY generated_at DESC"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch salary slips"})
	}
	defer rows.Close()

	slips := []models.SalarySlip{}
	for rows.Next() {
		var s models.SalarySlip
		err := rows.Scan(
			&s.ID, &s.PayrollRecordID, &s.StaffID, &s.StaffName, &s.StaffEmail,
			&s.PayrollMonth, &s.SlipNumber, &s.GeneratedAt, &s.SentAt, &s.Status, &s.PDFPath, &s.CreatedAt,
		)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		slips = append(slips, s)
	}

	return c.JSON(slips)
}

// GetSalarySlipDetails retrieves detailed salary slip information
func (h *SalarySlipHandler) GetSalarySlipDetails(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `
		SELECT 
			ss.id, ss.payroll_record_id, ss.staff_id, ss.staff_name, ss.staff_email,
			ss.payroll_month, ss.slip_number, ss.generated_at, ss.sent_at, ss.status,
			pr.department, pr.position, pr.basic_salary, pr.total_allowances,
			pr.total_deductions, pr.gross_salary, pr.net_salary,
			pr.working_days, pr.present_days, pr.absent_days, pr.leave_days,
			pr.overtime_hours, pr.overtime_amount, pr.bonus
		FROM salary_slips ss
		JOIN payroll_records pr ON ss.payroll_record_id = pr.id
		WHERE ss.id = $1
	`

	var slip struct {
		models.SalarySlip
		Department      string  `json:"department"`
		Position        string  `json:"position"`
		BasicSalary     float64 `json:"basic_salary"`
		TotalAllowances float64 `json:"total_allowances"`
		TotalDeductions float64 `json:"total_deductions"`
		GrossSalary     float64 `json:"gross_salary"`
		NetSalary       float64 `json:"net_salary"`
		WorkingDays     int     `json:"working_days"`
		PresentDays     int     `json:"present_days"`
		AbsentDays      int     `json:"absent_days"`
		LeaveDays       int     `json:"leave_days"`
		OvertimeHours   float64 `json:"overtime_hours"`
		OvertimeAmount  float64 `json:"overtime_amount"`
		Bonus           float64 `json:"bonus"`
	}

	err := h.DB.QueryRow(query, id).Scan(
		&slip.ID, &slip.PayrollRecordID, &slip.StaffID, &slip.StaffName, &slip.StaffEmail,
		&slip.PayrollMonth, &slip.SlipNumber, &slip.GeneratedAt, &slip.SentAt, &slip.Status,
		&slip.Department, &slip.Position, &slip.BasicSalary, &slip.TotalAllowances,
		&slip.TotalDeductions, &slip.GrossSalary, &slip.NetSalary,
		&slip.WorkingDays, &slip.PresentDays, &slip.AbsentDays, &slip.LeaveDays,
		&slip.OvertimeHours, &slip.OvertimeAmount, &slip.Bonus,
	)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Salary slip not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch salary slip"})
	}

	return c.JSON(slip)
}

// MarkSlipAsSent marks salary slips as sent
func (h *SalarySlipHandler) MarkSlipAsSent(c *fiber.Ctx) error {
	var input struct {
		SlipIDs []int `json:"slip_ids"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		UPDATE salary_slips
		SET status = 'sent', sent_at = $1
		WHERE id = ANY($2)
	`

	result, err := h.DB.Exec(query, time.Now(), input.SlipIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update salary slips"})
	}

	rowsAffected, _ := result.RowsAffected()

	return c.JSON(fiber.Map{
		"message": "Salary slips marked as sent",
		"count":   rowsAffected,
	})
}
