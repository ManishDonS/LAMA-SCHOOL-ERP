package handlers

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// UploadReceipt handles file upload for expense receipts
func (h *Handler) UploadReceipt(c *fiber.Ctx) error {
	expenseID := c.Params("id")

	// Verify expense exists
	var exists bool
	err := h.DB.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM expenses WHERE id = $1)", expenseID).Scan(&exists)
	if err != nil || !exists {
		return c.Status(404).JSON(fiber.Map{"error": "Expense not found"})
	}

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "No file uploaded"})
	}

	// Validate file type
	allowedTypes := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".pdf":  true,
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedTypes[ext] {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid file type. Only JPG, PNG, and PDF are allowed"})
	}

	// Validate file size (10MB)
	maxSize := int64(10 * 1024 * 1024)
	if file.Size > maxSize {
		return c.Status(400).JSON(fiber.Map{"error": "File size exceeds 10MB limit"})
	}

	// Create upload directory
	uploadDir := os.Getenv("UPLOAD_PATH")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	uploadDir = filepath.Join(uploadDir, "receipts")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("Error creating upload directory: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create upload directory"})
	}

	// Generate unique filename
	fileID := uuid.New().String()
	filename := fmt.Sprintf("%s_%s%s", fileID, time.Now().Format("20060102150405"), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	if err := c.SaveFile(file, filePath); err != nil {
		log.Printf("Error saving file: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save file"})
	}

	// Get user ID (from auth token in production)
	userID := c.Locals("userId")
	if userID == nil {
		userID = int64(1)
	}

	// Save receipt record to database
	query := `
		INSERT INTO expense_receipts 
		(expense_id, file_name, file_path, file_type, file_size, uploaded_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, expense_id, file_name, file_path, file_type, file_size, uploaded_by, uploaded_at
	`

	var receipt struct {
		ID         string    `json:"id"`
		ExpenseID  string    `json:"expenseId"`
		FileName   string    `json:"fileName"`
		FilePath   string    `json:"filePath"`
		FileType   string    `json:"fileType"`
		FileSize   int64     `json:"fileSize"`
		UploadedBy int64     `json:"uploadedBy"`
		UploadedAt time.Time `json:"uploadedAt"`
	}

	err = h.DB.QueryRow(
		context.Background(), query,
		expenseID, file.Filename, filePath, ext, file.Size, userID,
	).Scan(
		&receipt.ID, &receipt.ExpenseID, &receipt.FileName, &receipt.FilePath,
		&receipt.FileType, &receipt.FileSize, &receipt.UploadedBy, &receipt.UploadedAt,
	)

	if err != nil {
		log.Printf("Error saving receipt record: %v", err)
		// Clean up uploaded file
		os.Remove(filePath)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save receipt record"})
	}

	return c.Status(201).JSON(receipt)
}

// GetReceipts retrieves all receipts for an expense
func (h *Handler) GetReceipts(c *fiber.Ctx) error {
	expenseID := c.Params("id")

	query := `
		SELECT id, expense_id, file_name, file_path, file_type, file_size, uploaded_by, uploaded_at
		FROM expense_receipts
		WHERE expense_id = $1
		ORDER BY uploaded_at DESC
	`

	rows, err := h.DB.Query(context.Background(), query, expenseID)
	if err != nil {
		log.Printf("Error fetching receipts: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch receipts"})
	}
	defer rows.Close()

	receipts := []map[string]interface{}{}
	for rows.Next() {
		var receipt struct {
			ID         string    `json:"id"`
			ExpenseID  string    `json:"expenseId"`
			FileName   string    `json:"fileName"`
			FilePath   string    `json:"filePath"`
			FileType   string    `json:"fileType"`
			FileSize   int64     `json:"fileSize"`
			UploadedBy int64     `json:"uploadedBy"`
			UploadedAt time.Time `json:"uploadedAt"`
		}

		err := rows.Scan(
			&receipt.ID, &receipt.ExpenseID, &receipt.FileName, &receipt.FilePath,
			&receipt.FileType, &receipt.FileSize, &receipt.UploadedBy, &receipt.UploadedAt,
		)
		if err != nil {
			log.Printf("Error scanning receipt: %v", err)
			continue
		}

		receipts = append(receipts, map[string]interface{}{
			"id":          receipt.ID,
			"expenseId":   receipt.ExpenseID,
			"fileName":    receipt.FileName,
			"fileType":    receipt.FileType,
			"fileSize":    receipt.FileSize,
			"uploadedBy":  receipt.UploadedBy,
			"uploadedAt":  receipt.UploadedAt,
			"downloadUrl": fmt.Sprintf("/api/v1/expenses/%s/receipts/%s/download", expenseID, receipt.ID),
		})
	}

	return c.JSON(receipts)
}

// DownloadReceipt serves a receipt file
func (h *Handler) DownloadReceipt(c *fiber.Ctx) error {
	expenseID := c.Params("id")
	receiptID := c.Params("receiptId")

	query := `SELECT file_name, file_path FROM expense_receipts WHERE id = $1 AND expense_id = $2`

	var fileName, filePath string
	err := h.DB.QueryRow(context.Background(), query, receiptID, expenseID).Scan(&fileName, &filePath)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Receipt not found"})
	}

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return c.Status(404).JSON(fiber.Map{"error": "File not found"})
	}

	// Serve file
	return c.Download(filePath, fileName)
}

// DeleteReceipt deletes a receipt file and record
func (h *Handler) DeleteReceipt(c *fiber.Ctx) error {
	expenseID := c.Params("id")
	receiptID := c.Params("receiptId")

	query := `SELECT file_path FROM expense_receipts WHERE id = $1 AND expense_id = $2`

	var filePath string
	err := h.DB.QueryRow(context.Background(), query, receiptID, expenseID).Scan(&filePath)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Receipt not found"})
	}

	// Delete from database
	_, err = h.DB.Exec(context.Background(),
		"DELETE FROM expense_receipts WHERE id = $1", receiptID)
	if err != nil {
		log.Printf("Error deleting receipt record: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete receipt"})
	}

	// Delete file
	if err := os.Remove(filePath); err != nil {
		log.Printf("Warning: Failed to delete file %s: %v", filePath, err)
	}

	return c.JSON(fiber.Map{"message": "Receipt deleted successfully"})
}

// GetAnalytics returns expense analytics
func (h *Handler) GetAnalytics(c *fiber.Ctx) error {
	schoolID := c.Query("schoolId", "1")

	// Get date range (default: current month)
	now := time.Now()
	startDate := c.Query("startDate", fmt.Sprintf("%d-%02d-01", now.Year(), now.Month()))
	endDate := c.Query("endDate", now.Format("2006-01-02"))

	analytics := fiber.Map{}

	// Total by status
	statusQuery := `
		SELECT status, COUNT(*), COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE school_id = $1 AND expense_date >= $2 AND expense_date <= $3
		GROUP BY status
	`
	rows, err := h.DB.Query(context.Background(), statusQuery, schoolID, startDate, endDate)
	if err == nil {
		defer rows.Close()
		byStatus := make(map[string]fiber.Map)
		for rows.Next() {
			var status string
			var count int
			var total float64
			rows.Scan(&status, &count, &total)
			byStatus[status] = fiber.Map{"count": count, "total": total}
		}
		analytics["byStatus"] = byStatus
	}

	// Total by category
	categoryQuery := `
		SELECT c.name, c.icon, COUNT(e.id), COALESCE(SUM(e.amount), 0)
		FROM expenses e
		JOIN expense_categories c ON e.category_id = c.id
		WHERE e.school_id = $1 AND e.expense_date >= $2 AND e.expense_date <= $3
		GROUP BY c.id, c.name, c.icon
		ORDER BY SUM(e.amount) DESC
		LIMIT 10
	`
	rows, err = h.DB.Query(context.Background(), categoryQuery, schoolID, startDate, endDate)
	if err == nil {
		defer rows.Close()
		byCategory := []fiber.Map{}
		for rows.Next() {
			var name, icon string
			var count int
			var total float64
			rows.Scan(&name, &icon, &count, &total)
			byCategory = append(byCategory, fiber.Map{
				"name":  name,
				"icon":  icon,
				"count": count,
				"total": total,
			})
		}
		analytics["byCategory"] = byCategory
	}

	// Monthly trend (last 6 months)
	trendQuery := `
		SELECT 
			DATE_TRUNC('month', expense_date) as month,
			COUNT(*),
			COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE school_id = $1 AND expense_date >= NOW() - INTERVAL '6 months'
		GROUP BY month
		ORDER BY month ASC
	`
	rows, err = h.DB.Query(context.Background(), trendQuery, schoolID)
	if err == nil {
		defer rows.Close()
		trend := []fiber.Map{}
		for rows.Next() {
			var month time.Time
			var count int
			var total float64
			rows.Scan(&month, &count, &total)
			trend = append(trend, fiber.Map{
				"month": month.Format("2006-01"),
				"count": count,
				"total": total,
			})
		}
		analytics["monthlyTrend"] = trend
	}

	return c.JSON(analytics)
}

// GetBudgetStatus returns budget tracking information
func (h *Handler) GetBudgetStatus(c *fiber.Ctx) error {
	schoolID := c.Query("schoolId", "1")
	year := c.QueryInt("year", time.Now().Year())
	month := c.QueryInt("month", int(time.Now().Month()))

	query := `
		SELECT 
			c.id,
			c.name,
			c.icon,
			c.budget_monthly,
			COALESCE(SUM(e.amount), 0) as spent
		FROM expense_categories c
		LEFT JOIN expenses e ON c.id = e.category_id 
			AND e.school_id = $1
			AND EXTRACT(YEAR FROM e.expense_date) = $2
			AND EXTRACT(MONTH FROM e.expense_date) = $3
			AND e.status IN ('approved', 'paid')
		WHERE c.school_id = $1 AND c.is_active = true
		GROUP BY c.id, c.name, c.icon, c.budget_monthly
		ORDER BY c.name
	`

	rows, err := h.DB.Query(context.Background(), query, schoolID, year, month)
	if err != nil {
		log.Printf("Error fetching budget status: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch budget status"})
	}
	defer rows.Close()

	budgets := []fiber.Map{}
	totalBudget := 0.0
	totalSpent := 0.0

	for rows.Next() {
		var id, name, icon string
		var budgetMonthly *float64
		var spent float64

		rows.Scan(&id, &name, &icon, &budgetMonthly, &spent)

		budget := 0.0
		if budgetMonthly != nil {
			budget = *budgetMonthly
		}

		percentage := 0.0
		if budget > 0 {
			percentage = (spent / budget) * 100
		}

		budgets = append(budgets, fiber.Map{
			"categoryId":   id,
			"categoryName": name,
			"icon":         icon,
			"budget":       budget,
			"spent":        spent,
			"remaining":    budget - spent,
			"percentage":   percentage,
			"status":       getBudgetStatus(percentage),
		})

		totalBudget += budget
		totalSpent += spent
	}

	return c.JSON(fiber.Map{
		"year":              year,
		"month":             month,
		"categories":        budgets,
		"totalBudget":       totalBudget,
		"totalSpent":        totalSpent,
		"totalRemaining":    totalBudget - totalSpent,
		"overallPercentage": (totalSpent / totalBudget) * 100,
	})
}

func getBudgetStatus(percentage float64) string {
	if percentage >= 100 {
		return "exceeded"
	} else if percentage >= 90 {
		return "warning"
	} else if percentage >= 75 {
		return "caution"
	}
	return "good"
}
