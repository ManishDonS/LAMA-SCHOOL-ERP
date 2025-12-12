package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Create Fiber app
	app := fiber.New()

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Communication Service is running 💬")
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "communication",
		})
	})

	// Setup Routes for Channels (Placeholder)
	api := app.Group("/api/v1")
	channels := api.Group("/channels")
	channels.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "List of channels will be here",
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8005" // Assign a distinct port
	}

	log.Printf("Communication Service starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
