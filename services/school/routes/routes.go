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

	// Open routes (Tenant creation is usually protected by SuperAdmin auth, but for now we might leave it open or verify usage)
	// Actually, CreateSchool should be protected by SuperAdmin.
	// But let's assume we want to apply JWT middleware generally.
	// Since we are implementing RBAC for School Admins, we focus on /api/v1/schools/:id/roles

	// Group for school management (Super Admin only)
	schoolMgmt := schools.Group("/", middleware.JWTMiddleware(cfg), middleware.SuperAdminMiddleware())

	// Create/List schools
	schoolMgmt.Post("/", schoolHandler.CreateSchool)
	schoolMgmt.Get("/", schoolHandler.GetSchools)

	// Specific school operations
	schoolMgmt.Get("/:id", schoolHandler.GetSchool)
	schoolMgmt.Put("/:id", schoolHandler.UpdateSchool)
	schoolMgmt.Delete("/:id", schoolHandler.DeleteSchool)
	schoolMgmt.Get("/:code/stats", schoolHandler.GetSchoolStats)
	schoolMgmt.Get("/:id/admin", schoolHandler.GetSchoolAdmin)
	schoolMgmt.Put("/:id/admin", schoolHandler.UpdateSchoolAdmin)

	// Logo management
	schoolMgmt.Post("/:id/logo", logoHandler.UploadLogo)
	schoolMgmt.Delete("/:id/logo", logoHandler.DeleteLogo)

	// Module management
	moduleHandler := handlers.NewModuleHandler(db)
	api.Get("/modules", moduleHandler.GetAvailableModules) // Get all available modules

	// Module toggling is strictly SuperAdmin
	schoolMgmt.Post("/:id/modules", moduleHandler.ToggleModule)

	// Role & Permission management
	// Protected by JWT and Permission Middleware
	roleHandler := handlers.NewRoleHandler(db, tenantManager)

	// Group for roles, protected by JWT
	// Note: We need to import middleware package
	schoolsWithAuth := schools.Group("/:id", middleware.JWTMiddleware(cfg))

	roles := schoolsWithAuth.Group("/roles")
	roles.Get("/", middleware.PermissionMiddleware("roles.view"), roleHandler.ListRoles)
	roles.Post("/", middleware.PermissionMiddleware("roles.create"), roleHandler.CreateRole)
	roles.Get("/:roleId", middleware.PermissionMiddleware("roles.view"), roleHandler.GetRole)
	roles.Put("/:roleId", middleware.PermissionMiddleware("roles.update"), roleHandler.UpdateRole)
	roles.Delete("/:roleId", middleware.PermissionMiddleware("roles.delete"), roleHandler.DeleteRole)

	schoolsWithAuth.Get("/permissions", middleware.PermissionMiddleware("permissions.view"), roleHandler.ListPermissions)
}
