package routes

import (
	"school-erp/website/handlers"

	"github.com/gofiber/fiber/v2"
)

// SetupRoutes registers all routes for the service
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/website")

	// Website Routes
	api.Post("/", handlers.CreateWebsite)
	api.Get("/", handlers.GetWebsites)
	api.Get("/:id", handlers.GetWebsite)
	api.Put("/:id", handlers.UpdateWebsite)
	api.Delete("/:id", handlers.DeleteWebsite)
}
