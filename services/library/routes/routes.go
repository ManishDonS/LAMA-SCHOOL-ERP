package routes

import (
	"school-erp/library/config"
	"school-erp/library/handlers"
	"school-erp/library/middleware"
	"school-erp/library/pkg/tenant"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool, cfg *config.Config, tenantManager *tenant.TenantManager) {
	api := app.Group("/api/v1")

	// Apply Auth Middleware to all routes except health/docs
	auth := middleware.NewAuthMiddleware(cfg.JWTSecret)

	library := api.Group("/library", auth)

	// Book routes
	library.Get("/books", handlers.GetBooks)
	library.Post("/books", handlers.CreateBook)
	library.Get("/books/:id", handlers.GetBook)
	library.Put("/books/:id", handlers.UpdateBook)
	library.Delete("/books/:id", handlers.DeleteBook)

	// Issue routes
	library.Post("/issues", handlers.IssueBook)
	library.Put("/issues/:id/return", handlers.ReturnBook)
	library.Get("/issues", handlers.GetIssues)

	// Booking routes
	library.Post("/bookings", handlers.CreateBooking)
	library.Get("/bookings", handlers.GetBookings)
	library.Put("/bookings/:id/status", handlers.UpdateBookingStatus)
}
