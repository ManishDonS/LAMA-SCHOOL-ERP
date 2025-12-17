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
	// Create handler
	schoolHandler := handlers.NewSchoolHandler(db, tenantManager)

	// API routes
	api := app.Group("/api/v1")

	// School management endpoints
	schools := api.Group("/schools")

	// Open routes (Tenant creation is usually protected by SuperAdmin auth, but for now we might leave it open or verify usage)
	// Actually, CreateSchool should be protected by SuperAdmin.
	// But let's assume we want to apply JWT middleware generally.
	// Since we are implementing RBAC for School Admins, we focus on /api/v1/schools/:id/roles

	schools.Post("/upload-logo", schoolHandler.UploadLogo) // Upload school logo
	schools.Post("/", schoolHandler.CreateSchool)          // Create school

	// Routes that might need generic auth
	schools.Get("/", schoolHandler.GetSchools)                 // List schools
	schools.Get("/:id", schoolHandler.GetSchool)               // Get school by ID
	schools.Put("/:id", schoolHandler.UpdateSchool)            // Update school
	schools.Delete("/:id", schoolHandler.DeleteSchool)         // Delete school
	schools.Get("/:code/stats", schoolHandler.GetSchoolStats)  // Get school DB stats
	schools.Get("/:id/admin", schoolHandler.GetSchoolAdmin)    // Get school admin details
	schools.Put("/:id/admin", schoolHandler.UpdateSchoolAdmin) // Update school admin details

	// Module management
	moduleHandler := handlers.NewModuleHandler(db)
	api.Get("/modules", moduleHandler.GetAvailableModules)   // Get all available modules
	schools.Post("/:id/modules", moduleHandler.ToggleModule) // Toggle module for school

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
