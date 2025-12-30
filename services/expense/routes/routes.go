package routes

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/expense/config"
	"school-erp/expense/handlers"
	"school-erp/expense/middleware"
	"school-erp/expense/pkg/tenant"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool, tm *tenant.TenantManager, cfg *config.Config) {
	h := handlers.NewHandler(db)

	api := app.Group("/api/v1")

	// Apply Tenant Resolver Middleware to all v1 routes
	dbPort := 5432
	if cfg.DBPort != "" {
		fmt.Sscanf(cfg.DBPort, "%d", &dbPort)
	}

	api.Use(middleware.TenantResolver(middleware.TenantResolverConfig{
		MainDB:        db,
		TenantManager: tm,
		DBHost:        cfg.DBHost,
		DBPort:        dbPort,
	}))

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
