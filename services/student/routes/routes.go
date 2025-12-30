package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/student/config"
	"school-erp/student/handlers"
	"school-erp/student/middleware"
	"school-erp/student/pkg/tenant"
	"school-erp/student/service"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool, cfg *config.Config, tm *tenant.TenantManager, svc *service.StudentService) {
	h := handlers.NewStudentHandler(db, cfg, tm, svc)

	// Public routes prefix
	api := app.Group("/api/v1")

	// Apply Auth Middleware globally for student routes if needed,
	// or specifically to the group.

	// Students
	students := api.Group("/students")
	students.Use(middleware.NewAuthMiddleware(cfg.JWTSecret))
	students.Use(middleware.ModuleAccessMiddleware("students"))

	students.Get("/", h.ListStudents)
	students.Get("/:id", h.GetStudent)
	students.Post("/", h.CreateStudent)
	students.Put("/:id/details", h.UpdateStudent)
	students.Delete("/:id", h.DeleteStudent)

	// Enrollments
	enrollments := api.Group("/enrollments")
	enrollments.Use(middleware.NewAuthMiddleware(cfg.JWTSecret))

	enrollments.Get("/student/:student_id", h.GetStudentEnrollments)
	enrollments.Post("/", h.EnrollStudent)
	enrollments.Delete("/:id", h.RemoveEnrollment)
}
