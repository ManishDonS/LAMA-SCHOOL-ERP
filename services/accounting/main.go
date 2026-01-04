package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"school-erp/accounting/config"
	"school-erp/accounting/database"
	"school-erp/accounting/messaging"
	"school-erp/accounting/routes"
)

// Helper function to check if an origin is in the allowed list
func contains(allowedOrigins string, origin string) bool {
	origins := strings.Split(allowedOrigins, ",")
	for _, allowed := range origins {
		if strings.TrimSpace(allowed) == origin {
			return true
		}
	}
	return false
}

func main() {
	godotenv.Load()
	cfg := config.LoadConfig()

	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	messaging.ConnectNATS()
	if messaging.NatsConnection != nil {
		defer messaging.NatsConnection.Close()
	}

	app := fiber.New(fiber.Config{
		AppName: "School ERP Accounting Service",
	})
	setupMiddleware(app, cfg)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP Accounting Service",
			"version": "v1.0.0",
			"status":  "running",
			"endpoints": fiber.Map{
				"health":    "/health",
				"metrics":   "/metrics",
				"accounts":  "/api/v1/accounts",
				"tree":      "/api/v1/accounts/tree",
				"analytics": "/api/v1/accounts/analytics",
			},
		})
	})

	routes.SetupRoutes(app, db)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "accounting"})
	})
	app.Get("/metrics", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"uptime": "N/A", "status": "operational"})
	})

	port := cfg.Port
	log.Printf("Starting Accounting Service on port %s\n", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func setupMiddleware(app *fiber.App, cfg *config.Config) {
	app.Use(func(c *fiber.Ctx) error {
		fmt.Printf("[%s] %s %s\n", c.Method(), c.Path(), c.IP())
		return c.Next()
	})
	// CORS middleware with toggle
	if cfg.EnableCORS {
		app.Use(cors.New(cors.Config{
			AllowOrigins:     cfg.CORSOrigins,
			AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS,PATCH",
			AllowHeaders:     "Content-Type,Authorization,X-Requested-With,x-tenant-code",
			AllowCredentials: true,
			MaxAge:           7200,
		}))
	}
}
