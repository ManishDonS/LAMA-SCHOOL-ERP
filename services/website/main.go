package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"school-erp/website/config"
	"school-erp/website/database"
	"school-erp/website/routes"
	"syscall"

	_ "school-erp/website/docs" // load API Docs files (will be created by swag init)

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/swagger"
)

// @title School ERP Website Service
// @version 1.0
// @description Website Management Service for LAMA School ERP
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@lama-erp.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:3013
// @BasePath /api/v1/website
func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize Database
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	// db is now set in database.DB, but we can also pass it if needed
	_ = db

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: cfg.AppName,
	})

	// Middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSAllowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Swagger Route
	app.Get("/swagger/*", swagger.HandlerDefault)

	// Setup Routes
	routes.SetupRoutes(app)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "website-service",
		})
	})

	// Start server
	port := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Starting %s on port %s", cfg.AppName, port)

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := app.Listen(port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	<-c
	log.Println("Gracefully shutting down...")
	_ = app.Shutdown()
}
