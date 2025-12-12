package handlers

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
)

type TaxHandler struct {
	DB *sql.DB
}

// Nepal Tax Slabs for FY 2081/82
type TaxSlab struct {
	MinAmount float64
	MaxAmount float64
	TaxRate   float64
}

var nepalTaxSlabs = []TaxSlab{
	{0, 500000, 0.01},          // 1% up to 5 lakh
	{500001, 700000, 0.10},     // 10% from 5-7 lakh
	{700001, 1000000, 0.20},    // 20% from 7-10 lakh
	{1000001, 2000000, 0.30},   // 30% from 10-20 lakh
	{2000001, 999999999, 0.36}, // 36% above 20 lakh
}

// CalculateTax calculates annual and monthly tax based on Nepal tax slabs
func (h *TaxHandler) CalculateTax(c *fiber.Ctx) error {
	var input struct {
		AnnualIncome  float64 `json:"annual_income"`
		MaritalStatus string  `json:"marital_status"` // "single" or "married"
		HasDisability bool    `json:"has_disability"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Calculate exemption
	exemption := 500000.0 // Base exemption for single
	if input.MaritalStatus == "married" {
		exemption = 600000.0 // Additional 1 lakh for married
	}
	if input.HasDisability {
		exemption += 50000.0 // Additional 50k for disability
	}

	// Taxable income
	taxableIncome := input.AnnualIncome - exemption
	if taxableIncome <= 0 {
		return c.JSON(fiber.Map{
			"annual_income":  input.AnnualIncome,
			"exemption":      exemption,
			"taxable_income": 0,
			"annual_tax":     0,
			"monthly_tax":    0,
			"effective_rate": 0,
			"tax_breakdown":  []map[string]interface{}{},
		})
	}

	// Calculate tax using slabs
	var totalTax float64
	var breakdown []map[string]interface{}
	remainingIncome := taxableIncome

	for _, slab := range nepalTaxSlabs {
		if remainingIncome <= 0 {
			break
		}

		var taxableInSlab float64
		if slab.MaxAmount == 999999999 {
			// Last slab (unlimited)
			taxableInSlab = remainingIncome
		} else {
			slabRange := slab.MaxAmount - slab.MinAmount
			if remainingIncome > slabRange {
				taxableInSlab = slabRange
			} else {
				taxableInSlab = remainingIncome
			}
		}

		taxInSlab := taxableInSlab * slab.TaxRate
		totalTax += taxInSlab

		breakdown = append(breakdown, map[string]interface{}{
			"slab_range":     fmt.Sprintf("%.0f - %.0f", slab.MinAmount, slab.MaxAmount),
			"rate":           slab.TaxRate * 100,
			"taxable_amount": taxableInSlab,
			"tax_amount":     taxInSlab,
		})

		remainingIncome -= taxableInSlab
	}

	// Calculate Social Security Fund (SSF) - 20% of basic salary, max 42,500 annually
	ssfContribution := input.AnnualIncome * 0.20
	if ssfContribution > 42500 {
		ssfContribution = 42500
	}

	monthlyTax := totalTax / 12
	effectiveRate := (totalTax / input.AnnualIncome) * 100

	return c.JSON(fiber.Map{
		"annual_income":    input.AnnualIncome,
		"exemption":        exemption,
		"taxable_income":   taxableIncome,
		"annual_tax":       totalTax,
		"monthly_tax":      monthlyTax,
		"effective_rate":   effectiveRate,
		"ssf_contribution": ssfContribution,
		"monthly_ssf":      ssfContribution / 12,
		"tax_breakdown":    breakdown,
	})
}

// GetTaxSlabs returns current tax slabs
func (h *TaxHandler) GetTaxSlabs(c *fiber.Ctx) error {
	slabs := []map[string]interface{}{}

	for _, slab := range nepalTaxSlabs {
		maxDisplay := slab.MaxAmount
		if maxDisplay == 999999999 {
			maxDisplay = 0 // Indicate unlimited
		}

		slabs = append(slabs, map[string]interface{}{
			"min_amount": slab.MinAmount,
			"max_amount": maxDisplay,
			"tax_rate":   slab.TaxRate * 100,
		})
	}

	return c.JSON(fiber.Map{
		"fiscal_year": "2081/82",
		"slabs":       slabs,
		"exemptions": map[string]interface{}{
			"single":     500000,
			"married":    600000,
			"disability": 50000,
		},
	})
}

// UpdatePayrollWithTax updates payroll record with calculated tax
func (h *TaxHandler) UpdatePayrollWithTax(c *fiber.Ctx) error {
	recordID := c.Params("id")

	// Get payroll record
	var basicSalary float64
	query := `SELECT basic_salary FROM payroll_records WHERE id = $1`
	err := h.DB.QueryRow(query, recordID).Scan(&basicSalary)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Payroll record not found"})
	}

	// Calculate annual income (basic salary * 12)
	annualIncome := basicSalary * 12

	// For simplicity, assume single status (can be enhanced to read from staff profile)
	exemption := 500000.0
	taxableIncome := annualIncome - exemption

	if taxableIncome <= 0 {
		return c.JSON(fiber.Map{"message": "No tax applicable", "monthly_tax": 0})
	}

	// Calculate tax
	var totalTax float64
	remainingIncome := taxableIncome

	for _, slab := range nepalTaxSlabs {
		if remainingIncome <= 0 {
			break
		}

		var taxableInSlab float64
		if slab.MaxAmount == 999999999 {
			taxableInSlab = remainingIncome
		} else {
			slabRange := slab.MaxAmount - slab.MinAmount
			if remainingIncome > slabRange {
				taxableInSlab = slabRange
			} else {
				taxableInSlab = remainingIncome
			}
		}

		totalTax += taxableInSlab * slab.TaxRate
		remainingIncome -= taxableInSlab
	}

	monthlyTax := totalTax / 12

	// Update payroll record with calculated tax
	updateQuery := `
		UPDATE payroll_records
		SET tax_deduction = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`
	_, err = h.DB.Exec(updateQuery, monthlyTax, recordID)
	if err != nil {
		log.Printf("Error updating tax: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update tax"})
	}

	return c.JSON(fiber.Map{
		"message":     "Tax updated successfully",
		"annual_tax":  totalTax,
		"monthly_tax": monthlyTax,
		"record_id":   recordID,
	})
}

// GenerateTaxReport generates tax report for a staff member
func (h *TaxHandler) GenerateTaxReport(c *fiber.Ctx) error {
	staffID := c.Params("staffId")
	year := c.Query("year", "2081")

	query := `
		SELECT 
			payroll_month,
			basic_salary,
			total_allowances,
			gross_salary,
			tax_deduction
		FROM payroll_records
		WHERE staff_id = $1 AND payroll_month LIKE $2
		ORDER BY payroll_month
	`

	rows, err := h.DB.Query(query, staffID, year+"%")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch tax records"})
	}
	defer rows.Close()

	var totalIncome, totalTax float64
	var monthlyData []map[string]interface{}

	for rows.Next() {
		var month string
		var basic, allowances, gross, tax float64

		rows.Scan(&month, &basic, &allowances, &gross, &tax)

		totalIncome += gross
		totalTax += tax

		monthlyData = append(monthlyData, map[string]interface{}{
			"month":        month,
			"gross_salary": gross,
			"tax_deducted": tax,
		})
	}

	return c.JSON(fiber.Map{
		"staff_id":       staffID,
		"fiscal_year":    year,
		"total_income":   totalIncome,
		"total_tax":      totalTax,
		"monthly_data":   monthlyData,
		"effective_rate": (totalTax / totalIncome) * 100,
	})
}
