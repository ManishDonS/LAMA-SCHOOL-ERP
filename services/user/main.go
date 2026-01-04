package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"school-erp/user/config"
	"school-erp/user/database"
	"school-erp/user/messaging"
	"school-erp/user/middleware"
	"school-erp/user/pkg/tenant"
	"school-erp/user/routes"
)

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

	// Setup common middleware (Logger, CORS)
	setupMiddleware(app, cfg)

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

	// Tenant Resolver Middleware
	app.Use(middleware.NewTenantResolver(middleware.TenantResolverConfig{
		TenantManager: tenantManager,
		MainDB:        db,
		DBHost:        cfg.DBHost,
		DBPort:        5432, // Default port, could be from config
	}))

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

func setupMiddleware(app *fiber.App, cfg *config.Config) {
	// Logger middleware
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
