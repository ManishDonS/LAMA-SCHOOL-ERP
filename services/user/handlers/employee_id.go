package handlers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// GenerateEmployeeID generates a unique employee ID based on department code or role
// Format: [PREFIX]-[YEAR]-[SEQ]
// Example: SCI-2025-001, TCH-2025-042, STF-2025-015
func (h *UserHandler) GenerateEmployeeID(ctx context.Context, tenantDB *pgxpool.Pool, department, role string) (string, error) {
	// Determine prefix
	prefix := ""

	// Try to get department code first
	if department != "" {
		var code string
		err := tenantDB.QueryRow(ctx, "SELECT code FROM departments WHERE name = $1 LIMIT 1", department).Scan(&code)
		if err == nil && code != "" {
			prefix = strings.ToUpper(code)
		}
	}

	// Fallback to role-based prefix if no department code
	if prefix == "" {
		switch strings.ToLower(role) {
		case "teacher":
			prefix = "TCH"
		case "staff":
			prefix = "STF"
		case "admin":
			prefix = "ADM"
		default:
			prefix = "EMP"
		}
	}

	// Get current year
	year := time.Now().Year()

	// Find the next sequence number for this prefix-year combination
	var maxSeq int
	query := `
		SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM '\\d+$') AS INTEGER)), 0)
		FROM (
			SELECT employee_id FROM teachers WHERE employee_id LIKE $1
			UNION ALL
			SELECT employee_id FROM staff WHERE employee_id LIKE $1
		) AS all_employees
	`
	pattern := fmt.Sprintf("%s-%d-%%", prefix, year)

	err := tenantDB.QueryRow(ctx, query, pattern).Scan(&maxSeq)
	if err != nil {
		// If no existing IDs found, start from 0
		maxSeq = 0
	}

	// Generate new ID with incremented sequence
	newSeq := maxSeq + 1
	employeeID := fmt.Sprintf("%s-%d-%03d", prefix, year, newSeq)

	return employeeID, nil
}
