package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/exam/handlers"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool) {
	h := handlers.NewHandler(db)
	api := app.Group("/api/v1")
	
	// Add service-specific routes here
	api.Get("/", h.Health)
}
