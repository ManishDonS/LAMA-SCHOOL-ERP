package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/expense/handlers"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool) {
	h := handlers.NewHandler(db)

	api := app.Group("/api/v1")

	// Health check
	api.Get("/", h.Health)

	// Categories
	categories := api.Group("/categories")
	categories.Get("/", h.GetCategories)
	categories.Post("/", h.CreateCategory)
	categories.Put("/:id", h.UpdateCategory)
	categories.Delete("/:id", h.DeleteCategory)

	// Expenses
	expenses := api.Group("/expenses")
	expenses.Get("/", h.GetExpenses)
	expenses.Get("/:id", h.GetExpense)
	expenses.Post("/", h.CreateExpense)
	expenses.Put("/:id", h.UpdateExpense)
	expenses.Delete("/:id", h.DeleteExpense)
	expenses.Post("/:id/approve", h.ApproveExpense)
	expenses.Post("/:id/reject", h.RejectExpense)

	// File uploads
	expenses.Post("/:id/receipts", h.UploadReceipt)
	expenses.Get("/:id/receipts", h.GetReceipts)
	expenses.Get("/:id/receipts/:receiptId/download", h.DownloadReceipt)
	expenses.Delete("/:id/receipts/:receiptId", h.DeleteReceipt)

	// Analytics
	api.Get("/analytics", h.GetAnalytics)

	// Budget tracking
	api.Get("/budget/status", h.GetBudgetStatus)
}
