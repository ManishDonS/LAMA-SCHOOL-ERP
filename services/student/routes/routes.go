package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/student/config"
	"school-erp/student/handlers"
	"school-erp/student/middleware"
	"school-erp/student/pkg/tenant"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool, cfg *config.Config, tm *tenant.TenantManager) {
	h := handlers.NewStudentHandler(db, cfg, tm)

	api := app.Group("/api/v1")

	// Students
	students := api.Group("/students")
	students.Get("/", h.ListStudents)
	students.Get("/:id", h.GetStudent)

	studentsProtected := students.Group("/")
	studentsProtected.Use(middleware.NewAuthMiddleware(cfg.JWTSecret))
	studentsProtected.Post("/", h.CreateStudent)
	studentsProtected.Put("/:id", h.UpdateStudent)
	studentsProtected.Delete("/:id", h.DeleteStudent)

	// Enrollments
	enrollments := api.Group("/enrollments")
	enrollments.Get("/student/:student_id", h.GetStudentEnrollments)

	enrollmentsProtected := enrollments.Group("/")
	enrollmentsProtected.Use(middleware.NewAuthMiddleware(cfg.JWTSecret))
	enrollmentsProtected.Post("/", h.EnrollStudent)
	enrollmentsProtected.Delete("/:id", h.RemoveEnrollment)
}
