package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"

	"school-erp/expense/config"
	"school-erp/expense/database"
	"school-erp/expense/messaging"
	"school-erp/expense/pkg/tenant"
	"school-erp/expense/routes"
	"time"
)

// Helper function to check if an origin is in the allowed list
func contains(allowedOrigins string, origin string) bool {
	if origin == "" {
		return false
	}

	// Trim and normalize origin (remove trailing slash)
	origin = strings.TrimSpace(origin)
	origin = strings.TrimSuffix(origin, "/")

	origins := strings.Split(allowedOrigins, ",")
	for _, allowed := range origins {
		allowed = strings.TrimSpace(allowed)
		allowed = strings.TrimSuffix(allowed, "/")

		if allowed == origin {
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

	tenantManager, err := tenant.NewTenantManager(
		cfg.EncryptionKey,
		10,             // Max open conns per tenant
		5,              // Max idle conns
		30*time.Minute, // Conn max lifetime
	)
	if err != nil {
		log.Fatalf("Failed to initialize tenant manager: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:   "School ERP Expense Service",
		BodyLimit: 10 * 1024 * 1024, // 10MB for file uploads
	})

	setupMiddleware(app)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP Expense Service",
			"version": "v1.0.0",
			"status":  "running",
			"endpoints": fiber.Map{
				"health":     "/health",
				"metrics":    "/metrics",
				"categories": "/api/v1/categories",
				"expenses":   "/api/v1/expenses",
			},
		})
	})

	routes.SetupRoutes(app, db, tenantManager, cfg)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "expense"})
	})

	app.Get("/metrics", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"uptime": "N/A", "status": "operational"})
	})

	port := cfg.Port
	log.Printf("Starting Expense Service on port %s\n", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func setupMiddleware(app *fiber.App) {
	// Logging middleware
	app.Use(func(c *fiber.Ctx) error {
		fmt.Printf("[%s] %s %s\n", c.Method(), c.Path(), c.IP())
		return c.Next()
	})

	// CORS middleware
	app.Use(func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		allowedOrigins := os.Getenv("CORS_ALLOW_ORIGINS")
		if allowedOrigins == "" {
			allowedOrigins = "http://localhost:3000,http://127.0.0.1:3000"
		}

		if origin != "" && contains(allowedOrigins, origin) {
			c.Set("Access-Control-Allow-Origin", origin)
			c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH")
			c.Set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,X-Tenant-Code,x-tenant-code,X-Tenant-ID")
			c.Set("Access-Control-Allow-Credentials", "true")
			c.Set("Access-Control-Max-Age", "7200")
		}

		if c.Method() == "OPTIONS" {
			return c.SendStatus(204)
		}
		return c.Next()
	})
}
