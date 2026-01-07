package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/school/config"
	"school-erp/school/handlers"
	"school-erp/school/middleware"
	"school-erp/school/pkg/tenant"
)

// SetupRoutes sets up all application routes
func SetupRoutes(app *fiber.App, db *pgxpool.Pool, tenantManager *tenant.TenantManager, cfg *config.Config) {
	// Create handlers
	schoolHandler := handlers.NewSchoolHandler(db, tenantManager)
	logoHandler := handlers.NewLogoUploadHandler(db)

	// API routes
	api := app.Group("/api/v1")

	// School management endpoints
	schools := api.Group("/schools")

	// Public routes
	schools.Get("/public", schoolHandler.GetPublicSchools)

	// SuperAdmin-only routes - Register individually to avoid group middleware conflicts
	schools.Post("/", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), schoolHandler.CreateSchool)
	schools.Get("/", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), schoolHandler.GetSchools)
	schools.Put("/:id", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), schoolHandler.UpdateSchool)
	schools.Delete("/:id", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), schoolHandler.DeleteSchool)
	schools.Get("/:code/stats", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), schoolHandler.GetSchoolStats)
	schools.Get("/:id/admin", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), schoolHandler.GetSchoolAdmin)
	schools.Put("/:id/admin", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), schoolHandler.UpdateSchoolAdmin)

	// Logo management (SuperAdmin only)
	schools.Post("/:id/logo", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), logoHandler.UploadLogo)
	schools.Delete("/:id/logo", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware(), logoHandler.DeleteLogo)

	// Module management
	moduleHandler := handlers.NewModuleHandler(db)
	api.Get("/modules", moduleHandler.GetAvailableModules)
	schools.Post("/:id/modules", middleware.JWTMiddleware(cfg), moduleHandler.ToggleModule)

	// Role & Permission management - Protected by JWT and Permission Middleware
	roleHandler := handlers.NewRoleHandler(db, tenantManager)
	schoolsWithAuth := schools.Group("/:id", middleware.JWTMiddleware(cfg))

	roles := schoolsWithAuth.Group("/roles")
	roles.Get("/", middleware.PermissionMiddleware("roles.view"), roleHandler.ListRoles)
	roles.Post("/", middleware.PermissionMiddleware("roles.create"), roleHandler.CreateRole)
	roles.Get("/:roleId", middleware.PermissionMiddleware("roles.view"), roleHandler.GetRole)
	roles.Put("/:roleId", middleware.PermissionMiddleware("roles.update"), roleHandler.UpdateRole)
	roles.Delete("/:roleId", middleware.PermissionMiddleware("roles.delete"), roleHandler.DeleteRole)

	schoolsWithAuth.Get("/permissions", middleware.PermissionMiddleware("permissions.view"), roleHandler.ListPermissions)

	// Single school lookup for authenticated users - Registered LAST to test precedence
	// Ownership is checked in the handler
	schools.Get("/:id", middleware.JWTMiddleware(cfg), schoolHandler.GetSchool)
}
