package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"school-erp/user/config"
	"school-erp/user/database"
	"school-erp/user/messaging"
	"school-erp/user/middleware"
	"school-erp/user/pkg/tenant"
	"school-erp/user/routes"
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
	// Load environment variables
	godotenv.Load()

	// Initialize configuration
	cfg := config.LoadConfig()

	// Initialize database
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Connect to NATS
	messaging.ConnectNATS()
	if messaging.NatsConnection != nil {
		messaging.SubscribeModuleUpdates()
		defer messaging.NatsConnection.Close()
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "School ERP User Service",
	})

	// Initialize Tenant Manager
	tenantEncryptionKey := "default-key-change-in-production"
	if key := os.Getenv("ENCRYPTION_KEY"); key != "" {
		tenantEncryptionKey = key
	}

	tenantManager, err := tenant.NewTenantManager(
		tenantEncryptionKey,
		10,           // Max open conns
		5,            // Max idle conns
		300000000000, // Max lifetime (5 min) in nanoseconds? No, it's duration. 5*time.Minute
		"postgres",   // Superuser password
	)
	if err != nil {
		log.Fatalf("Failed to initialize tenant manager: %v", err)
	}

	// Setup middleware
	setupMiddleware(app, db, tenantManager, cfg)

	// Welcome route
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP User Service",
			"version": "v1.0.0",
			"status":  "running",
			"endpoints": fiber.Map{
				"health":    "/health",
				"metrics":   "/metrics",
				"users":     "/api/v1/users",
				"teachers":  "/api/v1/teachers",
				"students":  "/api/v1/students",
				"guardians": "/api/v1/guardians",
			},
		})
	})

	// Setup routes
	routes.SetupRoutes(app, db, cfg, tenantManager)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "user",
		})
	})

	// Metrics endpoint (basic)
	app.Get("/metrics", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"uptime": "N/A",
			"status": "operational",
		})
	})

	// Start server
	port := cfg.Port
	log.Printf("Starting User Service on port %s\n", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func setupMiddleware(app *fiber.App, db *pgxpool.Pool, tm *tenant.TenantManager, cfg *config.Config) {
	// Logger middleware
	app.Use(func(c *fiber.Ctx) error {
		fmt.Printf("[%s] %s %s\n", c.Method(), c.Path(), c.IP())
		return c.Next()
	})

	// CORS middleware
	app.Use(func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		allowedOrigins := os.Getenv("CORS_ALLOW_ORIGINS")
		if allowedOrigins == "" {
			allowedOrigins = "http://localhost:3000,http://localhost:3001"
		}

		// Check if origin is allowed (simple string matching, can be improved)
		if origin != "" && contains(allowedOrigins, origin) {
			c.Set("Access-Control-Allow-Origin", origin)
		}

		c.Set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS,PATCH")
		c.Set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,X-Tenant-Code")
		c.Set("Access-Control-Allow-Credentials", "true")

		if c.Method() == "OPTIONS" {
			return c.SendStatus(204)
		}
		return c.Next()
	})

	// Tenant Resolver Middleware
	app.Use(middleware.NewTenantResolver(middleware.TenantResolverConfig{
		TenantManager: tm,
		MainDB:        db,
		DBHost:        cfg.DBHost,
		DBPort:        5432, // Default port, could be from config
	}))
}
