package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"strconv"

	"school-erp/payroll/messaging"
	"school-erp/payroll/models"

	"github.com/gofiber/fiber/v2"
)

type PayrollStructureHandler struct {
	DB *sql.DB
}

// GetAllPayrollStructures retrieves all payroll structures
func (h *PayrollStructureHandler) GetAllPayrollStructures(c *fiber.Ctx) error {
	status := c.Query("status", "active")

	query := `
		SELECT id, staff_id, staff_name, staff_email, department, position,
			   basic_salary, hra, da, ta, medical_allowance, other_allowances,
			   pf_deduction, tax_deduction, insurance_deduction, other_deductions,
			   gross_salary, net_salary, effective_from, effective_to, status, notes,
			   created_at, updated_at
		FROM payroll_structures
		WHERE status = $1
		ORDER BY created_at DESC
	`

	rows, err := h.DB.Query(query, status)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll structures"})
	}
	defer rows.Close()

	structures := []models.PayrollStructure{}
	for rows.Next() {
		var s models.PayrollStructure
		err := rows.Scan(
			&s.ID, &s.StaffID, &s.StaffName, &s.StaffEmail, &s.Department, &s.Position,
			&s.BasicSalary, &s.HRA, &s.DA, &s.TA, &s.MedicalAllowance, &s.OtherAllowances,
			&s.PFDeduction, &s.TaxDeduction, &s.InsuranceDeduction, &s.OtherDeductions,
			&s.GrossSalary, &s.NetSalary, &s.EffectiveFrom, &s.EffectiveTo, &s.Status, &s.Notes,
			&s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		structures = append(structures, s)
	}

	return c.JSON(structures)
}

// GetPayrollStructure retrieves a single payroll structure by ID
func (h *PayrollStructureHandler) GetPayrollStructure(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `
		SELECT id, staff_id, staff_name, staff_email, department, position,
			   basic_salary, hra, da, ta, medical_allowance, other_allowances,
			   pf_deduction, tax_deduction, insurance_deduction, other_deductions,
			   gross_salary, net_salary, effective_from, effective_to, status, notes,
			   created_at, updated_at
		FROM payroll_structures
		WHERE id = $1
	`

	var s models.PayrollStructure
	err := h.DB.QueryRow(query, id).Scan(
		&s.ID, &s.StaffID, &s.StaffName, &s.StaffEmail, &s.Department, &s.Position,
		&s.BasicSalary, &s.HRA, &s.DA, &s.TA, &s.MedicalAllowance, &s.OtherAllowances,
		&s.PFDeduction, &s.TaxDeduction, &s.InsuranceDeduction, &s.OtherDeductions,
		&s.GrossSalary, &s.NetSalary, &s.EffectiveFrom, &s.EffectiveTo, &s.Status, &s.Notes,
		&s.CreatedAt, &s.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Payroll structure not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll structure"})
	}

	return c.JSON(s)
}

// GetPayrollStructureByStaffID retrieves payroll structure for a specific staff member
func (h *PayrollStructureHandler) GetPayrollStructureByStaffID(c *fiber.Ctx) error {
	staffID := c.Params("staffId")

	query := `
		SELECT id, staff_id, staff_name, staff_email, department, position,
			   basic_salary, hra, da, ta, medical_allowance, other_allowances,
			   pf_deduction, tax_deduction, insurance_deduction, other_deductions,
			   gross_salary, net_salary, effective_from, effective_to, status, notes,
			   created_at, updated_at
		FROM payroll_structures
		WHERE staff_id = $1 AND status = 'active'
		ORDER BY effective_from DESC
		LIMIT 1
	`

	var s models.PayrollStructure
	err := h.DB.QueryRow(query, staffID).Scan(
		&s.ID, &s.StaffID, &s.StaffName, &s.StaffEmail, &s.Department, &s.Position,
		&s.BasicSalary, &s.HRA, &s.DA, &s.TA, &s.MedicalAllowance, &s.OtherAllowances,
		&s.PFDeduction, &s.TaxDeduction, &s.InsuranceDeduction, &s.OtherDeductions,
		&s.GrossSalary, &s.NetSalary, &s.EffectiveFrom, &s.EffectiveTo, &s.Status, &s.Notes,
		&s.CreatedAt, &s.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Payroll structure not found for this staff member"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll structure"})
	}

	return c.JSON(s)
}

// CreatePayrollStructure creates a new payroll structure
func (h *PayrollStructureHandler) CreatePayrollStructure(c *fiber.Ctx) error {
	var input models.PayrollStructure
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		INSERT INTO payroll_structures (
			staff_id, staff_name, staff_email, department, position,
			basic_salary, hra, da, ta, medical_allowance, other_allowances,
			pf_deduction, tax_deduction, insurance_deduction, other_deductions,
			effective_from, effective_to, status, notes
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		RETURNING id, gross_salary, net_salary, created_at, updated_at
	`

	err := h.DB.QueryRow(
		query,
		input.StaffID, input.StaffName, input.StaffEmail, input.Department, input.Position,
		input.BasicSalary, input.HRA, input.DA, input.TA, input.MedicalAllowance, input.OtherAllowances,
		input.PFDeduction, input.TaxDeduction, input.InsuranceDeduction, input.OtherDeductions,
		input.EffectiveFrom, input.EffectiveTo, input.Status, input.Notes,
	).Scan(&input.ID, &input.GrossSalary, &input.NetSalary, &input.CreatedAt, &input.UpdatedAt)

	if err != nil {
		log.Printf("Error creating payroll structure: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create payroll structure"})
	}

	// Publish event
	eventData, _ := json.Marshal(fiber.Map{
		"event": "payroll_structure_created",
		"data":  input,
	})
	messaging.PublishEvent("payroll.structure.created", eventData)

	return c.Status(201).JSON(input)
}

// UpdatePayrollStructure updates an existing payroll structure
func (h *PayrollStructureHandler) UpdatePayrollStructure(c *fiber.Ctx) error {
	id := c.Params("id")
	var input models.PayrollStructure
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		UPDATE payroll_structures
		SET staff_name = $1, staff_email = $2, department = $3, position = $4,
			basic_salary = $5, hra = $6, da = $7, ta = $8,
			medical_allowance = $9, other_allowances = $10,
			pf_deduction = $11, tax_deduction = $12, insurance_deduction = $13,
			other_deductions = $14, effective_from = $15, effective_to = $16,
			status = $17, notes = $18, updated_at = CURRENT_TIMESTAMP
		WHERE id = $19
		RETURNING gross_salary, net_salary, updated_at
	`

	err := h.DB.QueryRow(
		query,
		input.StaffName, input.StaffEmail, input.Department, input.Position,
		input.BasicSalary, input.HRA, input.DA, input.TA,
		input.MedicalAllowance, input.OtherAllowances,
		input.PFDeduction, input.TaxDeduction, input.InsuranceDeduction,
		input.OtherDeductions, input.EffectiveFrom, input.EffectiveTo,
		input.Status, input.Notes, id,
	).Scan(&input.GrossSalary, &input.NetSalary, &input.UpdatedAt)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Payroll structure not found"})
	}
	if err != nil {
		log.Printf("Error updating payroll structure: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update payroll structure"})
	}

	idInt, _ := strconv.Atoi(id)
	input.ID = idInt

	// Publish event
	eventData, _ := json.Marshal(fiber.Map{
		"event": "payroll_structure_updated",
		"data":  input,
	})
	messaging.PublishEvent("payroll.structure.updated", eventData)

	return c.JSON(input)
}

// DeletePayrollStructure deletes a payroll structure
func (h *PayrollStructureHandler) DeletePayrollStructure(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `DELETE FROM payroll_structures WHERE id = $1`
	result, err := h.DB.Exec(query, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete payroll structure"})
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Payroll structure not found"})
	}

	// Publish event
	eventData, _ := json.Marshal(fiber.Map{
		"event":        "payroll_structure_deleted",
		"structure_id": id,
	})
	messaging.PublishEvent("payroll.structure.deleted", eventData)

	return c.JSON(fiber.Map{"message": "Payroll structure deleted successfully"})
}
