package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"school-erp/accounting/database"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	DB *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{DB: db}
}

// GetAccounts retrieves all accounts with optional filters
func (h *Handler) GetAccounts(c *fiber.Ctx) error {
	accountType := c.Query("type")
	active := c.Query("active")
	parentID := c.Query("parent_id")
	search := c.Query("search")
	schoolID := c.Query("school_id", "1")

	query := `
		SELECT a.id, a.code, a.name, a.type, a.parent_id, a.description, 
		       a.balance, a.opening_balance, a.is_active, a.level, 
		       a.school_id, a.created_at, a.updated_at,
		       p.code as parent_code, p.name as parent_name
		FROM accounts a
		LEFT JOIN accounts p ON a.parent_id = p.id
		WHERE a.school_id = $1
	`
	args := []interface{}{schoolID}
	argCount := 1

	if accountType != "" {
		argCount++
		query += fmt.Sprintf(" AND a.type = $%d", argCount)
		args = append(args, accountType)
	}

	if active != "" {
		argCount++
		isActive := active == "true"
		query += fmt.Sprintf(" AND a.is_active = $%d", argCount)
		args = append(args, isActive)
	}

	if parentID != "" {
		if parentID == "null" {
			query += " AND a.parent_id IS NULL"
		} else {
			argCount++
			query += fmt.Sprintf(" AND a.parent_id = $%d", argCount)
			args = append(args, parentID)
		}
	}

	if search != "" {
		argCount++
		query += fmt.Sprintf(" AND (a.code ILIKE $%d OR a.name ILIKE $%d)", argCount, argCount)
		args = append(args, "%"+search+"%")
	}

	query += " ORDER BY a.code"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		log.Printf("Error querying accounts: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve accounts"})
	}
	defer rows.Close()

	accounts := []database.Account{}
	for rows.Next() {
		var acc database.Account
		err := rows.Scan(
			&acc.ID, &acc.Code, &acc.Name, &acc.Type, &acc.ParentID,
			&acc.Description, &acc.Balance, &acc.OpeningBalance,
			&acc.IsActive, &acc.Level, &acc.SchoolID,
			&acc.CreatedAt, &acc.UpdatedAt,
			&acc.ParentCode, &acc.ParentName,
		)
		if err != nil {
			log.Printf("Error scanning account: %v", err)
			continue
		}
		accounts = append(accounts, acc)
	}

	return c.JSON(accounts)
}

// GetAccountTree retrieves accounts in hierarchical tree structure
func (h *Handler) GetAccountTree(c *fiber.Ctx) error {
	schoolID := c.Query("school_id", "1")

	query := `
		SELECT id, code, name, type, parent_id, description, 
		       balance, opening_balance, is_active, level, 
		       school_id, created_at, updated_at
		FROM accounts
		WHERE school_id = $1
		ORDER BY code
	`

	rows, err := h.DB.Query(query, schoolID)
	if err != nil {
		log.Printf("Error querying accounts: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve accounts"})
	}
	defer rows.Close()

	accountsMap := make(map[int64]*database.Account)
	var rootAccounts []*database.Account

	for rows.Next() {
		acc := &database.Account{}
		err := rows.Scan(
			&acc.ID, &acc.Code, &acc.Name, &acc.Type, &acc.ParentID,
			&acc.Description, &acc.Balance, &acc.OpeningBalance,
			&acc.IsActive, &acc.Level, &acc.SchoolID,
			&acc.CreatedAt, &acc.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning account: %v", err)
			continue
		}
		acc.Children = []*database.Account{}
		accountsMap[acc.ID] = acc
	}

	// Build tree structure
	for _, acc := range accountsMap {
		if acc.ParentID == nil {
			rootAccounts = append(rootAccounts, acc)
		} else {
			if parent, exists := accountsMap[*acc.ParentID]; exists {
				parent.Children = append(parent.Children, acc)
			}
		}
	}

	return c.JSON(rootAccounts)
}

// GetAccount retrieves a single account by ID
func (h *Handler) GetAccount(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `
		SELECT a.id, a.code, a.name, a.type, a.parent_id, a.description, 
		       a.balance, a.opening_balance, a.is_active, a.level, 
		       a.school_id, a.created_at, a.updated_at,
		       p.code as parent_code, p.name as parent_name
		FROM accounts a
		LEFT JOIN accounts p ON a.parent_id = p.id
		WHERE a.id = $1
	`

	var acc database.Account
	err := h.DB.QueryRow(query, id).Scan(
		&acc.ID, &acc.Code, &acc.Name, &acc.Type, &acc.ParentID,
		&acc.Description, &acc.Balance, &acc.OpeningBalance,
		&acc.IsActive, &acc.Level, &acc.SchoolID,
		&acc.CreatedAt, &acc.UpdatedAt,
		&acc.ParentCode, &acc.ParentName,
	)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Account not found"})
	}
	if err != nil {
		log.Printf("Error retrieving account: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve account"})
	}

	return c.JSON(acc)
}

// CreateAccount creates a new account
func (h *Handler) CreateAccount(c *fiber.Ctx) error {
	var req database.CreateAccountRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Validate required fields
	if req.Code == "" || req.Name == "" || req.Type == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Code, name, and type are required"})
	}

	// Validate account type
	validTypes := map[string]bool{
		"Asset": true, "Liability": true, "Equity": true,
		"Revenue": true, "Expense": true,
	}
	if !validTypes[req.Type] {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid account type"})
	}

	// Check for duplicate code
	var exists bool
	err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM accounts WHERE code = $1)", req.Code).Scan(&exists)
	if err != nil {
		log.Printf("Error checking duplicate code: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	if exists {
		return c.Status(400).JSON(fiber.Map{"error": "Account code already exists"})
	}

	// Calculate level based on parent
	level := 0
	if req.ParentID != nil {
		err := h.DB.QueryRow("SELECT level FROM accounts WHERE id = $1", *req.ParentID).Scan(&level)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid parent account"})
		}
		level++

		// Check for circular reference
		if err := h.checkCircularReference(*req.ParentID, 0); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}
	}

	// Set default school_id if not provided
	if req.SchoolID == 0 {
		req.SchoolID = 1
	}

	query := `
		INSERT INTO accounts (code, name, type, parent_id, description, opening_balance, balance, is_active, level, school_id)
		VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	var acc database.Account
	acc.Code = req.Code
	acc.Name = req.Name
	acc.Type = req.Type
	acc.ParentID = req.ParentID
	acc.Description = req.Description
	acc.OpeningBalance = req.OpeningBalance
	acc.Balance = req.OpeningBalance
	acc.IsActive = req.IsActive
	acc.Level = level
	acc.SchoolID = req.SchoolID

	err = h.DB.QueryRow(
		query,
		acc.Code, acc.Name, acc.Type, acc.ParentID, acc.Description,
		acc.OpeningBalance, acc.IsActive, acc.Level, acc.SchoolID,
	).Scan(&acc.ID, &acc.CreatedAt, &acc.UpdatedAt)

	if err != nil {
		log.Printf("Error creating account: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create account"})
	}

	// Log audit
	details, _ := json.Marshal(acc)
	h.logAudit(1, "CREATE", "ACCOUNT", acc.ID, string(details))

	return c.Status(201).JSON(acc)
}

// UpdateAccount updates an existing account
func (h *Handler) UpdateAccount(c *fiber.Ctx) error {
	id := c.Params("id")

	var req database.UpdateAccountRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argCount := 1

	if req.Code != "" {
		// Check for duplicate code
		var exists bool
		err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM accounts WHERE code = $1 AND id != $2)", req.Code, id).Scan(&exists)
		if err == nil && exists {
			return c.Status(400).JSON(fiber.Map{"error": "Account code already exists"})
		}
		updates = append(updates, fmt.Sprintf("code = $%d", argCount))
		args = append(args, req.Code)
		argCount++
	}

	if req.Name != "" {
		updates = append(updates, fmt.Sprintf("name = $%d", argCount))
		args = append(args, req.Name)
		argCount++
	}

	if req.Type != "" {
		updates = append(updates, fmt.Sprintf("type = $%d", argCount))
		args = append(args, req.Type)
		argCount++
	}

	if req.ParentID != nil {
		// Validate parent exists and calculate new level
		var parentLevel int
		err := h.DB.QueryRow("SELECT level FROM accounts WHERE id = $1", *req.ParentID).Scan(&parentLevel)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid parent account"})
		}

		// Check for circular reference
		accountID, _ := strconv.ParseInt(id, 10, 64)
		if *req.ParentID == accountID {
			return c.Status(400).JSON(fiber.Map{"error": "Account cannot be its own parent"})
		}

		updates = append(updates, fmt.Sprintf("parent_id = $%d", argCount))
		args = append(args, *req.ParentID)
		argCount++

		updates = append(updates, fmt.Sprintf("level = $%d", argCount))
		args = append(args, parentLevel+1)
		argCount++
	}

	if req.Description != "" {
		updates = append(updates, fmt.Sprintf("description = $%d", argCount))
		args = append(args, req.Description)
		argCount++
	}

	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argCount))
		args = append(args, *req.IsActive)
		argCount++
	}

	if len(updates) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No fields to update"})
	}

	updates = append(updates, "updated_at = CURRENT_TIMESTAMP")
	args = append(args, id)

	query := fmt.Sprintf("UPDATE accounts SET %s WHERE id = $%d", strings.Join(updates, ", "), argCount)

	result, err := h.DB.Exec(query, args...)
	if err != nil {
		log.Printf("Error updating account: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update account"})
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Account not found"})
	}

	// Log audit
	details, _ := json.Marshal(req)
	accountID, _ := strconv.ParseInt(id, 10, 64)
	h.logAudit(1, "UPDATE", "ACCOUNT", accountID, string(details))

	return c.JSON(fiber.Map{"message": "Account updated successfully"})
}

// DeleteAccount deletes an account (soft delete by setting is_active to false)
func (h *Handler) DeleteAccount(c *fiber.Ctx) error {
	id := c.Params("id")

	// Check if account has children
	var hasChildren bool
	err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM accounts WHERE parent_id = $1)", id).Scan(&hasChildren)
	if err != nil {
		log.Printf("Error checking children: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	if hasChildren {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot delete account with child accounts"})
	}

	// Check if account has transactions
	var hasTransactions bool
	err = h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM account_transactions WHERE account_id = $1)", id).Scan(&hasTransactions)
	if err != nil {
		log.Printf("Error checking transactions: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	if hasTransactions {
		// Soft delete
		_, err = h.DB.Exec("UPDATE accounts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1", id)
		if err != nil {
			log.Printf("Error soft deleting account: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to delete account"})
		}

		accountID, _ := strconv.ParseInt(id, 10, 64)
		h.logAudit(1, "DELETE (SOFT)", "ACCOUNT", accountID, "Deactivated due to existing transactions")

		return c.JSON(fiber.Map{"message": "Account deactivated successfully"})
	}

	// Hard delete if no transactions
	result, err := h.DB.Exec("DELETE FROM accounts WHERE id = $1", id)
	if err != nil {
		log.Printf("Error deleting account: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete account"})
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Account not found"})
	}

	accountID, _ := strconv.ParseInt(id, 10, 64)
	h.logAudit(1, "DELETE (HARD)", "ACCOUNT", accountID, "Permanently deleted")

	return c.JSON(fiber.Map{"message": "Account deleted successfully"})
}

// GetAccountTransactions retrieves transactions for a specific account
func (h *Handler) GetAccountTransactions(c *fiber.Ctx) error {
	accountID := c.Params("id")
	limit := c.Query("limit", "50")

	query := `
		SELECT t.id, t.account_id, t.date, t.description, 
		       t.debit_amount, t.credit_amount, t.balance,
		       t.reference_type, t.reference_id, t.created_by, t.created_at,
		       a.code as account_code, a.name as account_name
		FROM account_transactions t
		JOIN accounts a ON t.account_id = a.id
		WHERE t.account_id = $1
		ORDER BY t.date DESC, t.created_at DESC
		LIMIT $2
	`

	rows, err := h.DB.Query(query, accountID, limit)
	if err != nil {
		log.Printf("Error querying transactions: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve transactions"})
	}
	defer rows.Close()

	transactions := []database.AccountTransaction{}
	for rows.Next() {
		var txn database.AccountTransaction
		err := rows.Scan(
			&txn.ID, &txn.AccountID, &txn.Date, &txn.Description,
			&txn.DebitAmount, &txn.CreditAmount, &txn.Balance,
			&txn.ReferenceType, &txn.ReferenceID, &txn.CreatedBy, &txn.CreatedAt,
			&txn.AccountCode, &txn.AccountName,
		)
		if err != nil {
			log.Printf("Error scanning transaction: %v", err)
			continue
		}
		transactions = append(transactions, txn)
	}

	return c.JSON(transactions)
}

// GetAnalytics retrieves analytics data for the dashboard
func (h *Handler) GetAnalytics(c *fiber.Ctx) error {
	schoolID := c.Query("school_id", "1")

	analytics := database.AccountAnalytics{
		TypeDistribution: make(map[string]float64),
		AccountCount:     make(map[string]int),
	}

	// Get totals by type
	query := `
		SELECT type, 
		       SUM(balance) as total_balance,
		       COUNT(*) as count
		FROM accounts
		WHERE school_id = $1 AND is_active = true
		GROUP BY type
	`

	rows, err := h.DB.Query(query, schoolID)
	if err != nil {
		log.Printf("Error querying analytics: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve analytics"})
	}
	defer rows.Close()

	for rows.Next() {
		var accountType string
		var totalBalance float64
		var count int

		err := rows.Scan(&accountType, &totalBalance, &count)
		if err != nil {
			log.Printf("Error scanning analytics: %v", err)
			continue
		}

		analytics.TypeDistribution[accountType] = totalBalance
		analytics.AccountCount[accountType] = count

		switch accountType {
		case "Asset":
			analytics.TotalAssets = totalBalance
		case "Liability":
			analytics.TotalLiabilities = totalBalance
		case "Equity":
			analytics.TotalEquity = totalBalance
		case "Revenue":
			analytics.TotalRevenue = totalBalance
		case "Expense":
			analytics.TotalExpenses = totalBalance
		}
	}

	// Calculate net income (Revenue - Expenses)
	analytics.NetIncome = analytics.TotalRevenue - analytics.TotalExpenses

	return c.JSON(analytics)
}

// Helper function to check for circular references
func (h *Handler) checkCircularReference(parentID int64, depth int) error {
	if depth > 10 {
		return fmt.Errorf("maximum hierarchy depth exceeded")
	}

	var nextParentID *int64
	err := h.DB.QueryRow("SELECT parent_id FROM accounts WHERE id = $1", parentID).Scan(&nextParentID)
	if err != nil {
		return nil // Parent doesn't exist or has no parent
	}

	if nextParentID != nil {
		return h.checkCircularReference(*nextParentID, depth+1)
	}

	return nil
}

// ExportAccountsCSV exports all accounts to CSV format
func (h *Handler) ExportAccountsCSV(c *fiber.Ctx) error {
	schoolID := c.Query("school_id", "1")

	query := `
		SELECT a.code, a.name, a.type, p.code as parent_code, a.description, 
		       a.balance, a.opening_balance, a.is_active
		FROM accounts a
		LEFT JOIN accounts p ON a.parent_id = p.id
		WHERE a.school_id = $1
		ORDER BY a.code
	`

	rows, err := h.DB.Query(query, schoolID)
	if err != nil {
		log.Printf("Error querying accounts: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to export accounts"})
	}
	defer rows.Close()

	// Build CSV content
	csv := "Code,Name,Type,Parent Code,Description,Balance,Opening Balance,Active\n"
	for rows.Next() {
		var code, name, accountType, description string
		var parentCode *string
		var balance, openingBalance float64
		var isActive bool

		err := rows.Scan(&code, &name, &accountType, &parentCode, &description, &balance, &openingBalance, &isActive)
		if err != nil {
			log.Printf("Error scanning account: %v", err)
			continue
		}

		parent := ""
		if parentCode != nil {
			parent = *parentCode
		}

		active := "true"
		if !isActive {
			active = "false"
		}

		csv += fmt.Sprintf("%s,%s,%s,%s,%s,%.2f,%.2f,%s\n",
			code, name, accountType, parent, description, balance, openingBalance, active)
	}

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", "attachment; filename=chart_of_accounts.csv")
	return c.SendString(csv)
}

// ImportAccountsCSV imports accounts from CSV format
func (h *Handler) ImportAccountsCSV(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "No file uploaded"})
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to open file"})
	}
	defer src.Close()

	// Read file content
	content := make([]byte, file.Size)
	_, err = src.Read(content)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to read file"})
	}

	// Parse CSV
	lines := strings.Split(string(content), "\n")
	if len(lines) < 2 {
		return c.Status(400).JSON(fiber.Map{"error": "CSV file is empty"})
	}

	imported := 0
	errors := []string{}

	// Skip header line
	for i, line := range lines[1:] {
		if strings.TrimSpace(line) == "" {
			continue
		}

		parts := strings.Split(line, ",")
		if len(parts) < 8 {
			errors = append(errors, fmt.Sprintf("Line %d: Invalid format", i+2))
			continue
		}

		code := strings.TrimSpace(parts[0])
		name := strings.TrimSpace(parts[1])
		accountType := strings.TrimSpace(parts[2])
		parentCode := strings.TrimSpace(parts[3])
		description := strings.TrimSpace(parts[4])
		openingBalance := 0.0
		if parts[6] != "" {
			fmt.Sscanf(parts[6], "%f", &openingBalance)
		}
		isActive := strings.TrimSpace(parts[7]) == "true"

		// Validate account type
		validTypes := map[string]bool{
			"Asset": true, "Liability": true, "Equity": true,
			"Revenue": true, "Expense": true,
		}
		if !validTypes[accountType] {
			errors = append(errors, fmt.Sprintf("Line %d: Invalid account type '%s'", i+2, accountType))
			continue
		}

		// Check if account already exists
		var exists bool
		err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM accounts WHERE code = $1)", code).Scan(&exists)
		if err == nil && exists {
			errors = append(errors, fmt.Sprintf("Line %d: Account code '%s' already exists", i+2, code))
			continue
		}

		// Get parent ID if parent code is provided
		var parentID *int64
		if parentCode != "" {
			var pid int64
			err := h.DB.QueryRow("SELECT id FROM accounts WHERE code = $1", parentCode).Scan(&pid)
			if err != nil {
				errors = append(errors, fmt.Sprintf("Line %d: Parent account '%s' not found", i+2, parentCode))
				continue
			}
			parentID = &pid
		}

		// Calculate level
		level := 0
		if parentID != nil {
			h.DB.QueryRow("SELECT level FROM accounts WHERE id = $1", *parentID).Scan(&level)
			level++
		}

		// Insert account
		query := `
			INSERT INTO accounts (code, name, type, parent_id, description, opening_balance, balance, is_active, level, school_id)
			VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, 1)
		`
		_, err = h.DB.Exec(query, code, name, accountType, parentID, description, openingBalance, isActive, level)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Line %d: Failed to import - %v", i+2, err))
			continue
		}

		imported++
	}

	return c.JSON(fiber.Map{
		"imported": imported,
		"errors":   errors,
		"total":    len(lines) - 1,
	})
}

// GetAuditLogs retrieves audit logs
func (h *Handler) GetAuditLogs(c *fiber.Ctx) error {
	limit := c.Query("limit", "100")
	entity := c.Query("entity")
	entityID := c.Query("entity_id")

	query := `
		SELECT id, user_id, action, entity, entity_id, details, created_at
		FROM account_audit_logs
		WHERE 1=1
	`
	args := []interface{}{}
	argCount := 0

	if entity != "" {
		argCount++
		query += fmt.Sprintf(" AND entity = $%d", argCount)
		args = append(args, entity)
	}

	if entityID != "" {
		argCount++
		query += fmt.Sprintf(" AND entity_id = $%d", argCount)
		args = append(args, entityID)
	}

	query += " ORDER BY created_at DESC LIMIT " + limit

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		log.Printf("Error querying audit logs: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve audit logs"})
	}
	defer rows.Close()

	logs := []database.AuditLog{}
	for rows.Next() {
		var l database.AuditLog
		err := rows.Scan(&l.ID, &l.UserID, &l.Action, &l.Entity, &l.EntityID, &l.Details, &l.CreatedAt)
		if err != nil {
			log.Printf("Error scanning audit log: %v", err)
			continue
		}
		logs = append(logs, l)
	}

	return c.JSON(logs)
}

// Private helper to log audit events
func (h *Handler) logAudit(userID int64, action, entity string, entityID int64, details string) {
	query := `
		INSERT INTO account_audit_logs (user_id, action, entity, entity_id, details)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := h.DB.Exec(query, userID, action, entity, entityID, details)
	if err != nil {
		log.Printf("Error logging audit: %v", err)
	}
}

// GetTemplates retrieves available account templates
func (h *Handler) GetTemplates(c *fiber.Ctx) error {
	query := `SELECT id, name, description, type, created_at FROM account_templates`
	rows, err := h.DB.Query(query)
	if err != nil {
		log.Printf("Error querying templates: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve templates"})
	}
	defer rows.Close()

	templates := []database.AccountTemplate{}
	for rows.Next() {
		var t database.AccountTemplate
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.Type, &t.CreatedAt); err != nil {
			log.Printf("Error scanning template: %v", err)
			continue
		}
		templates = append(templates, t)
	}

	return c.JSON(templates)
}

// ApplyTemplate applies a template to create accounts
func (h *Handler) ApplyTemplate(c *fiber.Ctx) error {
	id := c.Params("id")
	schoolID := c.Query("school_id", "1")
	schoolIDInt, _ := strconv.ParseInt(schoolID, 10, 64)

	// Check if accounts already exist
	var count int
	h.DB.QueryRow("SELECT COUNT(*) FROM accounts WHERE school_id = $1", schoolID).Scan(&count)
	if count > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot apply template: Accounts already exist for this school"})
	}

	// Get template items
	rows, err := h.DB.Query("SELECT code, name, type, parent_code, description FROM account_template_items WHERE template_id = $1 ORDER BY code", id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve template items"})
	}
	defer rows.Close()

	var items []database.AccountTemplateItem
	for rows.Next() {
		var item database.AccountTemplateItem
		if err := rows.Scan(&item.Code, &item.Name, &item.Type, &item.ParentCode, &item.Description); err != nil {
			continue
		}
		items = append(items, item)
	}

	if len(items) == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Template not found or empty"})
	}

	tx, err := h.DB.Begin()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database transaction error"})
	}
	defer tx.Rollback()

	// Map to store created account IDs by code for parent lookup
	accountIDs := make(map[string]int64)

	// Sort items to ensure parents are created first (simple sort by code works for standard standard charts)
	// For robustness, could implement topological sort, but simple sort usually suffices for structured COA codes

	for _, item := range items {
		var parentID *int64
		if item.ParentCode != nil && *item.ParentCode != "" {
			if pid, ok := accountIDs[*item.ParentCode]; ok {
				parentID = &pid
			}
		}

		level := 0
		if parentID != nil {
			var pLevel int
			tx.QueryRow("SELECT level FROM accounts WHERE id = $1", *parentID).Scan(&pLevel)
			level = pLevel + 1
		}

		var newID int64
		err := tx.QueryRow(`
			INSERT INTO accounts (code, name, type, parent_id, description, is_active, level, school_id)
			VALUES ($1, $2, $3, $4, $5, true, $6, $7)
			RETURNING id
		`, item.Code, item.Name, item.Type, parentID, item.Description, level, schoolIDInt).Scan(&newID)

		if err != nil {
			log.Printf("Error applying template item %s: %v", item.Code, err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create account from template"})
		}
		accountIDs[item.Code] = newID
	}

	if err := tx.Commit(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to commit transaction"})
	}

	// Log audit
	h.logAudit(1, "APPLY_TEMPLATE", "TEMPLATE", 0, fmt.Sprintf("Applied template ID %s", id))

	return c.JSON(fiber.Map{"message": "Template applied successfully", "accounts_created": len(accountIDs)})
}

// SetBudget sets or updates a budget for an account
func (h *Handler) SetBudget(c *fiber.Ctx) error {
	accountID := c.Params("id")
	var req database.AccountBudget
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	accID, _ := strconv.ParseInt(accountID, 10, 64)
	if req.FiscalYear == 0 {
		req.FiscalYear = time.Now().Year()
	}

	query := `
		INSERT INTO account_budgets (account_id, fiscal_year, amount, notes, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (account_id, fiscal_year) 
		DO UPDATE SET amount = EXCLUDED.amount, notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP
		RETURNING id
	`

	var budgetID int64
	err := h.DB.QueryRow(query, accID, req.FiscalYear, req.Amount, req.Notes).Scan(&budgetID)
	if err != nil {
		log.Printf("Error setting budget: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to set budget"})
	}

	// Log audit
	h.logAudit(1, "SET_BUDGET", "BUDGET", budgetID, fmt.Sprintf("Set budget for account %s year %d: %.2f", accountID, req.FiscalYear, req.Amount))

	return c.JSON(fiber.Map{"message": "Budget set successfully", "id": budgetID})
}

// GetAccountBudgets retrieves budgets for an account
func (h *Handler) GetAccountBudgets(c *fiber.Ctx) error {
	accountID := c.Params("id")

	query := `SELECT id, account_id, fiscal_year, amount, notes, created_at, updated_at FROM account_budgets WHERE account_id = $1 ORDER BY fiscal_year DESC`
	rows, err := h.DB.Query(query, accountID)
	if err != nil {
		log.Printf("Error querying budgets: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve budgets"})
	}
	defer rows.Close()

	budgets := []database.AccountBudget{}
	for rows.Next() {
		var b database.AccountBudget
		if err := rows.Scan(&b.ID, &b.AccountID, &b.FiscalYear, &b.Amount, &b.Notes, &b.CreatedAt, &b.UpdatedAt); err != nil {
			continue
		}
		budgets = append(budgets, b)
	}

	return c.JSON(budgets)
}

// CreateReconciliation creates a new reconciliation session
func (h *Handler) CreateReconciliation(c *fiber.Ctx) error {
	var req database.Reconciliation
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.AccountID == 0 || req.StatementDate == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Account ID and Statement Date are required"})
	}

	query := `
		INSERT INTO reconciliations (account_id, statement_date, starting_balance, ending_balance, status, notes)
		VALUES ($1, $2, $3, $4, 'DRAFT', $5)
		RETURNING id
	`

	var id int64
	err := h.DB.QueryRow(query, req.AccountID, req.StatementDate, req.StartingBalance, req.EndingBalance, req.Notes).Scan(&id)
	if err != nil {
		log.Printf("Error creating reconciliation: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create reconciliation"})
	}

	h.logAudit(1, "CREATE_RECONCILIATION", "RECONCILIATION", id, fmt.Sprintf("Created reconciliation for account %d", req.AccountID))

	return c.JSON(fiber.Map{"message": "Reconciliation created", "id": id})
}

// GetReconciliations retrieves reconciliations for an account
func (h *Handler) GetReconciliations(c *fiber.Ctx) error {
	accountID := c.Params("id")

	query := `SELECT id, account_id, statement_date, starting_balance, ending_balance, status, notes, created_at FROM reconciliations WHERE account_id = $1 ORDER BY statement_date DESC`
	rows, err := h.DB.Query(query, accountID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve reconciliations"})
	}
	defer rows.Close()

	recons := []database.Reconciliation{}
	for rows.Next() {
		var r database.Reconciliation
		if err := rows.Scan(&r.ID, &r.AccountID, &r.StatementDate, &r.StartingBalance, &r.EndingBalance, &r.Status, &r.Notes, &r.CreatedAt); err != nil {
			continue
		}
		recons = append(recons, r)
	}

	return c.JSON(recons)
}
