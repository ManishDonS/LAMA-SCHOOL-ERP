package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/school/handlers"
	"school-erp/school/pkg/tenant"
)

// SetupRoutes sets up all application routes
func SetupRoutes(app *fiber.App, db *pgxpool.Pool, tenantManager *tenant.TenantManager) {
	// Create handler
	schoolHandler := handlers.NewSchoolHandler(db, tenantManager)

	// API routes
	api := app.Group("/api/v1")

	// School management endpoints
	schools := api.Group("/schools")
	schools.Post("/upload-logo", schoolHandler.UploadLogo)           // Upload school logo
	schools.Post("/", schoolHandler.CreateSchool)                    // Create school
	schools.Get("/", schoolHandler.GetSchools)                       // List schools
	schools.Get("/:id", schoolHandler.GetSchool)                     // Get school by ID
	schools.Put("/:id", schoolHandler.UpdateSchool)                  // Update school
	schools.Delete("/:id", schoolHandler.DeleteSchool)               // Delete school
	schools.Get("/:code/stats", schoolHandler.GetSchoolStats)        // Get school DB stats
}
