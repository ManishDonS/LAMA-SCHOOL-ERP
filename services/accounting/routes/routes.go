package routes

import (
	"database/sql"

	"school-erp/accounting/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, db *sql.DB) {
	h := handlers.NewHandler(db)

	api := app.Group("/api/v1")

	// Template routes
	templates := api.Group("/templates")
	templates.Get("/", h.GetTemplates)
	templates.Post("/:id/apply", h.ApplyTemplate)

	// Account routes
	accounts := api.Group("/accounts")
	accounts.Get("/", h.GetAccounts)
	accounts.Get("/tree", h.GetAccountTree)
	accounts.Get("/analytics", h.GetAnalytics)
	accounts.Get("/export", h.ExportAccountsCSV)
	accounts.Post("/import", h.ImportAccountsCSV)
	accounts.Get("/audit-logs", h.GetAuditLogs)
	accounts.Get("/:id", h.GetAccount)
	accounts.Post("/", h.CreateAccount)
	accounts.Put("/:id", h.UpdateAccount)
	accounts.Delete("/:id", h.DeleteAccount)
	accounts.Get("/:id/transactions", h.GetAccountTransactions)
	accounts.Put("/:id/budget", h.SetBudget)
	accounts.Get("/:id/budgets", h.GetAccountBudgets)
	accounts.Post("/:id/reconciliations", h.CreateReconciliation)
	accounts.Get("/:id/reconciliations", h.GetReconciliations)
}
