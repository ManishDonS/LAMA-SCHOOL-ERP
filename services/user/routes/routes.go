package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/user/handlers"
	"school-erp/user/middleware"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool) {
	h := handlers.NewUserHandler(db)

	// Setup event subscriptions
	h.SetupEventSubscriptions()

	// Public routes
	api := app.Group("/api/v1")

	// User endpoints
	users := api.Group("/users")
	users.Get("/by-school/:school_id", h.GetUsersBySchool)
	users.Get("/:id", h.GetUser)

	// Protected routes (require authentication)
	usersProtected := users.Group("/")
	usersProtected.Use(middleware.AuthMiddleware)
	usersProtected.Post("/", h.CreateUser)
	usersProtected.Put("/:id", h.UpdateUser)
	usersProtected.Delete("/:id", h.DeleteUser)

	// Teacher routes
	teachers := api.Group("/teachers")
	teachers.Get("/", h.GetTeachers)
	teachers.Get("/:id", h.GetTeacher)
	teachersProtected := teachers.Group("/")
	teachersProtected.Use(middleware.AuthMiddleware)
	teachersProtected.Post("/", h.CreateTeacher)
	teachersProtected.Put("/:id", h.UpdateTeacher)

	// Parent routes
	parents := api.Group("/parents")
	parents.Get("/", h.GetParents)
	parents.Get("/:id", h.GetParent)
	parentsProtected := parents.Group("/")
	parentsProtected.Use(middleware.AuthMiddleware)
	parentsProtected.Post("/", h.CreateParent)
	parentsProtected.Put("/:id", h.UpdateParent)

	// Staff routes
	staff := api.Group("/staff")
	staff.Get("/", h.GetStaff)
	staff.Get("/:id", h.GetStaffMember)
	staffProtected := staff.Group("/")
	staffProtected.Use(middleware.AuthMiddleware)
	staffProtected.Post("/", h.CreateStaff)
	staffProtected.Put("/:id", h.UpdateStaff)
}
