package main

import (
	"log"
	"os"
	"school-erp/communication/database"
	"school-erp/communication/handlers"

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

	// Connect to Database
	database.ConnectDB()

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

	// API Routes
	api := app.Group("/api/v1")
	channels := api.Group("/channels")

	// Channel Routes
	channels.Get("/", handlers.GetChannels)
	channels.Post("/", handlers.CreateChannel)

	// Message Routes (nested)
	channels.Get("/:channelId/messages", handlers.GetMessages)
	channels.Post("/:channelId/messages", handlers.SendMessage)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8008" // Use 8008 or available port. Main file had 8005 but doc said 8008?
		// Wait, docker-compose isn't updated for this service yet.
		// Let's use 8005 as in previous file.
		port = "8005"
	}

	log.Printf("Communication Service starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
