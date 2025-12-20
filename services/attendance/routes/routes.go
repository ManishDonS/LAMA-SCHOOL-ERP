package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/attendance/config"
	"school-erp/attendance/handlers"
	"school-erp/attendance/pkg/tenant"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool, cfg *config.Config, tm *tenant.TenantManager, tenantResolver fiber.Handler) {
	h := handlers.NewHandler(db)
	api := app.Group("/api/v1")

	// Public routes
	api.Get("/health", h.Health)

	// Protected routes with tenant resolver
	attendance := api.Group("/attendance")
	attendance.Use(tenantResolver)

	attendance.Get("/", h.ListAttendance)
	attendance.Post("/", h.MarkAttendance)
	attendance.Put("/:id", h.UpdateAttendance)
	attendance.Delete("/:id", h.DeleteAttendance)
}
