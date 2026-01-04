package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"school-erp/payroll/config"
	"school-erp/payroll/database"
	"school-erp/payroll/messaging"
	"school-erp/payroll/routes"
)

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

	if err := database.RunAdditionalMigrations(db); err != nil {
		log.Fatalf("Failed to run additional migrations: %v", err)
	}

	messaging.ConnectNATS()
	if messaging.NatsConnection != nil {
		defer messaging.NatsConnection.Close()
	}

	app := fiber.New(fiber.Config{
		AppName:   "School ERP Payroll Service",
		BodyLimit: 10 * 1024 * 1024, // 10MB
	})

	setupMiddleware(app, cfg)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP Payroll Service",
			"version": "v1.0.0",
			"status":  "running",
			"endpoints": fiber.Map{
				"health":             "/health",
				"metrics":            "/metrics",
				"payroll_structures": "/api/v1/payroll-structures",
				"payroll_processing": "/api/v1/payroll",
				"salary_slips":       "/api/v1/salary-slips",
				"reports":            "/api/v1/reports",
			},
		})
	})

	routes.SetupRoutes(app, db)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "payroll"})
	})

	app.Get("/metrics", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"uptime": "N/A", "status": "operational"})
	})

	port := cfg.Port
	log.Printf("Starting Payroll Service on port %s\n", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func setupMiddleware(app *fiber.App, cfg *config.Config) {
	// Logging middleware
	app.Use(func(c *fiber.Ctx) error {
		fmt.Printf("[%s] %s %s\n", c.Method(), c.Path(), c.IP())
		return c.Next()
	})

	// CORS middleware with toggle
	if cfg.EnableCORS {
		app.Use(cors.New(cors.Config{
			AllowOrigins:     cfg.AllowedOrigins,
			AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS,PATCH",
			AllowHeaders:     "Content-Type,Authorization,X-Requested-With,x-tenant-code",
			AllowCredentials: true,
			MaxAge:           7200,
		}))
	}
}
