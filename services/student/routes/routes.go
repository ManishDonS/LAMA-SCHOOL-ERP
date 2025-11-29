package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/student/handlers"
	"school-erp/student/middleware"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool) {
	h := handlers.NewStudentHandler(db)

	api := app.Group("/api/v1")

	// Students
	students := api.Group("/students")
	students.Get("/", h.ListStudents)
	students.Get("/:id", h.GetStudent)

	studentsProtected := students.Group("/")
	studentsProtected.Use(middleware.AuthMiddleware)
	studentsProtected.Post("/", h.CreateStudent)
	studentsProtected.Put("/:id", h.UpdateStudent)
	studentsProtected.Delete("/:id", h.DeleteStudent)

	// Enrollments
	enrollments := api.Group("/enrollments")
	enrollments.Get("/student/:student_id", h.GetStudentEnrollments)

	enrollmentsProtected := enrollments.Group("/")
	enrollmentsProtected.Use(middleware.AuthMiddleware)
	enrollmentsProtected.Post("/", h.EnrollStudent)
	enrollmentsProtected.Delete("/:id", h.RemoveEnrollment)
}
