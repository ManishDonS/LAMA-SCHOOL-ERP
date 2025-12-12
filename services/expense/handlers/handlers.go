package handlers

import (
	"context"
	"fmt"
	"log"
	"time"

	"school-erp/expense/models"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

// Health check
func (h *Handler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "healthy", "service": "expense"})
}

// ==================== CATEGORIES ====================

// GetCategories retrieves all expense categories
func (h *Handler) GetCategories(c *fiber.Ctx) error {
	schoolID := c.Query("schoolId", "1")

	query := `
		SELECT id, school_id, name, description, parent_category_id, 
		       budget_monthly, budget_yearly, color, icon, is_active, 
		       created_at, updated_at
		FROM expense_categories
		WHERE school_id = $1 AND is_active = true
		ORDER BY name ASC
	`

	rows, err := h.DB.Query(context.Background(), query, schoolID)
	if err != nil {
		log.Printf("Error fetching categories: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch categories"})
	}
	defer rows.Close()

	categories := []models.ExpenseCategory{}
	for rows.Next() {
		var cat models.ExpenseCategory
		err := rows.Scan(
			&cat.ID, &cat.SchoolID, &cat.Name, &cat.Description, &cat.ParentCategoryID,
			&cat.BudgetMonthly, &cat.BudgetYearly, &cat.Color, &cat.Icon, &cat.IsActive,
			&cat.CreatedAt, &cat.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning category: %v", err)
			continue
		}
		categories = append(categories, cat)
	}

	return c.JSON(categories)
}

// CreateCategory creates a new expense category
func (h *Handler) CreateCategory(c *fiber.Ctx) error {
	var req models.CreateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	schoolID := c.Query("schoolId", "1")

	query := `
		INSERT INTO expense_categories 
		(school_id, name, description, budget_monthly, budget_yearly, color, icon)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, school_id, name, description, budget_monthly, budget_yearly, 
		          color, icon, is_active, created_at, updated_at
	`

	var category models.ExpenseCategory
	err := h.DB.QueryRow(
		context.Background(), query,
		schoolID, req.Name, req.Description, req.BudgetMonthly,
		req.BudgetYearly, req.Color, req.Icon,
	).Scan(
		&category.ID, &category.SchoolID, &category.Name, &category.Description,
		&category.BudgetMonthly, &category.BudgetYearly, &category.Color, &category.Icon,
		&category.IsActive, &category.CreatedAt, &category.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating category: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create category"})
	}

	return c.Status(201).JSON(category)
}

// UpdateCategory updates an existing category
func (h *Handler) UpdateCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	var req models.CreateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		UPDATE expense_categories
		SET name = $1, description = $2, budget_monthly = $3, budget_yearly = $4,
		    color = $5, icon = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
		RETURNING id, school_id, name, description, budget_monthly, budget_yearly,
		          color, icon, is_active, created_at, updated_at
	`

	var category models.ExpenseCategory
	err := h.DB.QueryRow(
		context.Background(), query,
		req.Name, req.Description, req.BudgetMonthly, req.BudgetYearly,
		req.Color, req.Icon, id,
	).Scan(
		&category.ID, &category.SchoolID, &category.Name, &category.Description,
		&category.BudgetMonthly, &category.BudgetYearly, &category.Color, &category.Icon,
		&category.IsActive, &category.CreatedAt, &category.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error updating category: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update category"})
	}

	return c.JSON(category)
}

// DeleteCategory soft deletes a category
func (h *Handler) DeleteCategory(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `UPDATE expense_categories SET is_active = false WHERE id = $1`
	_, err := h.DB.Exec(context.Background(), query, id)
	if err != nil {
		log.Printf("Error deleting category: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete category"})
	}

	return c.JSON(fiber.Map{"message": "Category deleted successfully"})
}

// ==================== EXPENSES ====================

// GetExpenses retrieves expenses with filters
func (h *Handler) GetExpenses(c *fiber.Ctx) error {
	schoolID := c.Query("schoolId", "1")

	query := `
		SELECT e.id, e.school_id, e.category_id, e.department_id, e.expense_date,
		       e.description, e.amount, e.currency, e.vendor_name, e.payment_method,
		       e.reference_number, e.notes, e.status, e.is_recurring, e.recurring_frequency,
		       e.created_by, e.approved_by, e.approved_at, e.paid_at, e.created_at, e.updated_at
		FROM expenses e
		WHERE e.school_id = $1
		ORDER BY e.expense_date DESC, e.created_at DESC
		LIMIT 100
	`

	rows, err := h.DB.Query(context.Background(), query, schoolID)
	if err != nil {
		log.Printf("Error fetching expenses: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch expenses"})
	}
	defer rows.Close()

	expenses := []models.Expense{}
	for rows.Next() {
		var exp models.Expense
		err := rows.Scan(
			&exp.ID, &exp.SchoolID, &exp.CategoryID, &exp.DepartmentID, &exp.ExpenseDate,
			&exp.Description, &exp.Amount, &exp.Currency, &exp.VendorName, &exp.PaymentMethod,
			&exp.ReferenceNumber, &exp.Notes, &exp.Status, &exp.IsRecurring, &exp.RecurringFrequency,
			&exp.CreatedBy, &exp.ApprovedBy, &exp.ApprovedAt, &exp.PaidAt, &exp.CreatedAt, &exp.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning expense: %v", err)
			continue
		}
		expenses = append(expenses, exp)
	}

	return c.JSON(expenses)
}

// GetExpense retrieves a single expense by ID
func (h *Handler) GetExpense(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `
		SELECT e.id, e.school_id, e.category_id, e.department_id, e.expense_date,
		       e.description, e.amount, e.currency, e.vendor_name, e.payment_method,
		       e.reference_number, e.notes, e.status, e.is_recurring, e.recurring_frequency,
		       e.created_by, e.approved_by, e.approved_at, e.paid_at, e.created_at, e.updated_at
		FROM expenses e
		WHERE e.id = $1
	`

	var exp models.Expense
	err := h.DB.QueryRow(context.Background(), query, id).Scan(
		&exp.ID, &exp.SchoolID, &exp.CategoryID, &exp.DepartmentID, &exp.ExpenseDate,
		&exp.Description, &exp.Amount, &exp.Currency, &exp.VendorName, &exp.PaymentMethod,
		&exp.ReferenceNumber, &exp.Notes, &exp.Status, &exp.IsRecurring, &exp.RecurringFrequency,
		&exp.CreatedBy, &exp.ApprovedBy, &exp.ApprovedAt, &exp.PaidAt, &exp.CreatedAt, &exp.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error fetching expense: %v", err)
		return c.Status(404).JSON(fiber.Map{"error": "Expense not found"})
	}

	return c.JSON(exp)
}

// CreateExpense creates a new expense
func (h *Handler) CreateExpense(c *fiber.Ctx) error {
	var req models.CreateExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	schoolID := c.Query("schoolId", "1")
	userID := c.Locals("userId")
	if userID == nil {
		userID = int64(1) // Default for testing
	}

	query := `
		INSERT INTO expenses 
		(school_id, category_id, expense_date, description, amount, vendor_name,
		 payment_method, reference_number, notes, status, is_recurring, recurring_frequency, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, school_id, category_id, expense_date, description, amount, currency,
		          vendor_name, payment_method, reference_number, notes, status, is_recurring,
		          recurring_frequency, created_by, created_at, updated_at
	`

	var expense models.Expense
	err := h.DB.QueryRow(
		context.Background(), query,
		schoolID, req.CategoryID, req.ExpenseDate, req.Description, req.Amount,
		req.VendorName, req.PaymentMethod, req.ReferenceNumber, req.Notes,
		req.Status, req.IsRecurring, req.RecurringFrequency, userID,
	).Scan(
		&expense.ID, &expense.SchoolID, &expense.CategoryID, &expense.ExpenseDate,
		&expense.Description, &expense.Amount, &expense.Currency, &expense.VendorName,
		&expense.PaymentMethod, &expense.ReferenceNumber, &expense.Notes, &expense.Status,
		&expense.IsRecurring, &expense.RecurringFrequency, &expense.CreatedBy,
		&expense.CreatedAt, &expense.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error creating expense: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": fmt.Sprintf("Failed to create expense: %v", err)})
	}

	return c.Status(201).JSON(expense)
}

// UpdateExpense updates an existing expense
func (h *Handler) UpdateExpense(c *fiber.Ctx) error {
	id := c.Params("id")
	var req models.CreateExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		UPDATE expenses
		SET category_id = $1, expense_date = $2, description = $3, amount = $4,
		    vendor_name = $5, payment_method = $6, reference_number = $7, notes = $8,
		    status = $9, is_recurring = $10, recurring_frequency = $11, updated_at = CURRENT_TIMESTAMP
		WHERE id = $12
		RETURNING id, school_id, category_id, expense_date, description, amount, currency,
		          vendor_name, payment_method, reference_number, notes, status, is_recurring,
		          recurring_frequency, created_by, created_at, updated_at
	`

	var expense models.Expense
	err := h.DB.QueryRow(
		context.Background(), query,
		req.CategoryID, req.ExpenseDate, req.Description, req.Amount,
		req.VendorName, req.PaymentMethod, req.ReferenceNumber, req.Notes,
		req.Status, req.IsRecurring, req.RecurringFrequency, id,
	).Scan(
		&expense.ID, &expense.SchoolID, &expense.CategoryID, &expense.ExpenseDate,
		&expense.Description, &expense.Amount, &expense.Currency, &expense.VendorName,
		&expense.PaymentMethod, &expense.ReferenceNumber, &expense.Notes, &expense.Status,
		&expense.IsRecurring, &expense.RecurringFrequency, &expense.CreatedBy,
		&expense.CreatedAt, &expense.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error updating expense: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update expense"})
	}

	return c.JSON(expense)
}

// DeleteExpense deletes an expense
func (h *Handler) DeleteExpense(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `DELETE FROM expenses WHERE id = $1`
	_, err := h.DB.Exec(context.Background(), query, id)
	if err != nil {
		log.Printf("Error deleting expense: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete expense"})
	}

	return c.JSON(fiber.Map{"message": "Expense deleted successfully"})
}

// ApproveExpense approves an expense
func (h *Handler) ApproveExpense(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("userId")
	if userID == nil {
		userID = int64(1) // Default for testing
	}

	now := time.Now()
	query := `
		UPDATE expenses
		SET status = 'approved', approved_by = $1, approved_at = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`

	_, err := h.DB.Exec(context.Background(), query, userID, now, id)
	if err != nil {
		log.Printf("Error approving expense: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to approve expense"})
	}

	return c.JSON(fiber.Map{"message": "Expense approved successfully"})
}

// RejectExpense rejects an expense
func (h *Handler) RejectExpense(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `UPDATE expenses SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = $1`
	_, err := h.DB.Exec(context.Background(), query, id)
	if err != nil {
		log.Printf("Error rejecting expense: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to reject expense"})
	}

	return c.JSON(fiber.Map{"message": "Expense rejected successfully"})
}
