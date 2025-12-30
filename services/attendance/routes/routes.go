package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/attendance/config"
	"school-erp/attendance/handlers"
	"school-erp/attendance/middleware"
	"school-erp/attendance/pkg/tenant"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool, cfg *config.Config, tm *tenant.TenantManager, tenantResolver fiber.Handler) {
	h := handlers.NewHandler(db)
	api := app.Group("/api/v1")

	// Public routes
	api.Get("/health", h.Health)

	// Protected routes with tenant resolver and authentication
	attendance := api.Group("/attendance")

	// Chain middlewares: Tenant Resolver -> Authentication -> Module Access -> Authorization
	attendance.Use(tenantResolver)
	attendance.Use(middleware.AuthMiddleware)
	attendance.Use(middleware.ModuleAccessMiddleware("attendance"))

	// Granular RBAC using Casbin
	attendance.Get("/", middleware.CasbinMiddleware("attendance", "view"), h.ListAttendance)
	attendance.Post("/", middleware.CasbinMiddleware("attendance", "create"), h.MarkAttendance)
	attendance.Put("/:id", middleware.CasbinMiddleware("attendance", "update"), h.UpdateAttendance)
	attendance.Delete("/:id", middleware.CasbinMiddleware("attendance", "delete"), h.DeleteAttendance)
}
