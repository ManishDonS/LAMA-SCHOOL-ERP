package handlers

import (
	"database/sql"
	"log"

	"school-erp/payroll/models"

	"github.com/gofiber/fiber/v2"
)

type ReportsHandler struct {
	DB *sql.DB
}

// GetDepartmentWiseSalary returns department-wise salary summary
func (h *ReportsHandler) GetDepartmentWiseSalary(c *fiber.Ctx) error {
	month := c.Query("month")

	query := `
		SELECT 
			department,
			COUNT(*) as staff_count,
			COALESCE(SUM(net_salary), 0) as total_salary,
			COALESCE(AVG(net_salary), 0) as average_salary
		FROM payroll_records
	`

	args := []interface{}{}
	if month != "" {
		query += " WHERE payroll_month = $1"
		args = append(args, month)
	}

	query += " GROUP BY department ORDER BY total_salary DESC"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch department salary report"})
	}
	defer rows.Close()

	departments := []models.DepartmentSalary{}
	for rows.Next() {
		var d models.DepartmentSalary
		err := rows.Scan(&d.Department, &d.StaffCount, &d.TotalSalary, &d.AverageSalary)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		departments = append(departments, d)
	}

	return c.JSON(departments)
}

// GetMonthlyPayrollTrend returns monthly payroll trend
func (h *ReportsHandler) GetMonthlyPayrollTrend(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 12)

	query := `
		SELECT 
			payroll_month,
			COUNT(*) as staff_count,
			COALESCE(SUM(gross_salary), 0) as total_gross,
			COALESCE(SUM(total_deductions), 0) as total_deductions,
			COALESCE(SUM(net_salary), 0) as total_net
		FROM payroll_records
		GROUP BY payroll_month
		ORDER BY payroll_month DESC
		LIMIT $1
	`

	rows, err := h.DB.Query(query, limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll trend"})
	}
	defer rows.Close()

	trend := []map[string]interface{}{}
	for rows.Next() {
		var month string
		var staffCount int
		var totalGross, totalDeductions, totalNet float64

		err := rows.Scan(&month, &staffCount, &totalGross, &totalDeductions, &totalNet)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		trend = append(trend, map[string]interface{}{
			"month":            month,
			"staff_count":      staffCount,
			"total_gross":      totalGross,
			"total_deductions": totalDeductions,
			"total_net":        totalNet,
		})
	}

	return c.JSON(trend)
}

// GetPayrollAnalytics returns comprehensive payroll analytics
func (h *ReportsHandler) GetPayrollAnalytics(c *fiber.Ctx) error {
	month := c.Query("month")

	if month == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Month parameter is required"})
	}

	// Get overall summary
	summaryQuery := `
		SELECT 
			COUNT(*) as total_staff,
			COALESCE(SUM(gross_salary), 0) as total_gross,
			COALESCE(SUM(total_deductions), 0) as total_deductions,
			COALESCE(SUM(net_salary), 0) as total_net,
			COALESCE(AVG(net_salary), 0) as average_salary,
			COALESCE(MAX(net_salary), 0) as max_salary,
			COALESCE(MIN(net_salary), 0) as min_salary
		FROM payroll_records
		WHERE payroll_month = $1
	`

	var analytics struct {
		TotalStaff      int     `json:"total_staff"`
		TotalGross      float64 `json:"total_gross"`
		TotalDeductions float64 `json:"total_deductions"`
		TotalNet        float64 `json:"total_net"`
		AverageSalary   float64 `json:"average_salary"`
		MaxSalary       float64 `json:"max_salary"`
		MinSalary       float64 `json:"min_salary"`
	}

	err := h.DB.QueryRow(summaryQuery, month).Scan(
		&analytics.TotalStaff,
		&analytics.TotalGross,
		&analytics.TotalDeductions,
		&analytics.TotalNet,
		&analytics.AverageSalary,
		&analytics.MaxSalary,
		&analytics.MinSalary,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch analytics"})
	}

	// Get department breakdown
	deptQuery := `
		SELECT department, COUNT(*), COALESCE(SUM(net_salary), 0)
		FROM payroll_records
		WHERE payroll_month = $1
		GROUP BY department
	`

	rows, err := h.DB.Query(deptQuery, month)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch department breakdown"})
	}
	defer rows.Close()

	departments := []map[string]interface{}{}
	for rows.Next() {
		var dept string
		var count int
		var total float64
		rows.Scan(&dept, &count, &total)
		departments = append(departments, map[string]interface{}{
			"department": dept,
			"count":      count,
			"total":      total,
		})
	}

	return c.JSON(fiber.Map{
		"summary":     analytics,
		"departments": departments,
	})
}

// GetStaffPayrollHistory returns payroll history for a specific staff member
func (h *ReportsHandler) GetStaffPayrollHistory(c *fiber.Ctx) error {
	staffID := c.Params("staffId")
	limit := c.QueryInt("limit", 12)

	query := `
		SELECT 
			id, payroll_month, department, position,
			basic_salary, total_allowances, total_deductions,
			gross_salary, net_salary, status, created_at
		FROM payroll_records
		WHERE staff_id = $1
		ORDER BY payroll_month DESC
		LIMIT $2
	`

	rows, err := h.DB.Query(query, staffID, limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll history"})
	}
	defer rows.Close()

	history := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var month, dept, position, status string
		var basic, allowances, deductions, gross, net float64
		var createdAt string

		err := rows.Scan(&id, &month, &dept, &position, &basic, &allowances, &deductions, &gross, &net, &status, &createdAt)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		history = append(history, map[string]interface{}{
			"id":               id,
			"payroll_month":    month,
			"department":       dept,
			"position":         position,
			"basic_salary":     basic,
			"total_allowances": allowances,
			"total_deductions": deductions,
			"gross_salary":     gross,
			"net_salary":       net,
			"status":           status,
			"created_at":       createdAt,
		})
	}

	return c.JSON(history)
}

// ExportPayrollReport exports payroll data (placeholder for CSV/Excel export)
func (h *ReportsHandler) ExportPayrollReport(c *fiber.Ctx) error {
	month := c.Query("month")
	format := c.Query("format", "json")

	if month == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Month parameter is required"})
	}

	query := `
		SELECT 
			staff_id, staff_name, department, position,
			basic_salary, total_allowances, total_deductions,
			gross_salary, net_salary, status
		FROM payroll_records
		WHERE payroll_month = $1
		ORDER BY department, staff_name
	`

	rows, err := h.DB.Query(query, month)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch payroll data"})
	}
	defer rows.Close()

	records := []map[string]interface{}{}
	for rows.Next() {
		var staffID, staffName, dept, position, status string
		var basic, allowances, deductions, gross, net float64

		err := rows.Scan(&staffID, &staffName, &dept, &position, &basic, &allowances, &deductions, &gross, &net, &status)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		records = append(records, map[string]interface{}{
			"staff_id":         staffID,
			"staff_name":       staffName,
			"department":       dept,
			"position":         position,
			"basic_salary":     basic,
			"total_allowances": allowances,
			"total_deductions": deductions,
			"gross_salary":     gross,
			"net_salary":       net,
			"status":           status,
		})
	}

	if format == "csv" {
		// TODO: Implement CSV export
		return c.Status(501).JSON(fiber.Map{"error": "CSV export not yet implemented"})
	}

	return c.JSON(fiber.Map{
		"month":   month,
		"records": records,
		"total":   len(records),
	})
}
