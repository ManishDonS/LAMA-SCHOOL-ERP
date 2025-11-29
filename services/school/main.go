package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"school-erp/school/config"
	"school-erp/school/database"
	"school-erp/school/pkg/tenant"
	"school-erp/school/routes"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize main database connection pool
	mainDB, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize main database: %v\n", err)
	}
	defer mainDB.Close()

	// Run global migrations (schools table in main database)
	if err := database.RunMigrations(mainDB); err != nil {
		log.Fatalf("Failed to run migrations: %v\n", err)
	}

	// Create tenant manager for handling multi-tenant connections
	tenantManager, err := tenant.NewTenantManager(
		cfg.EncryptionKey,
		int32(cfg.MaxConnections),
		int32(cfg.MaxIdleConn),
		cfg.ConnMaxLifetime,
		cfg.MainDBPassword,
	)
	if err != nil {
		log.Fatalf("Failed to create tenant manager: %v", err)
	}
	defer tenantManager.CloseAllConnections()

	// Create Fiber app with default configuration
	app := fiber.New(fiber.Config{
		AppName: "School ERP - School Service",
		Prefork: false, // Set to true for production with multiple cores
	})

	// Setup middleware
	setupMiddleware(app)

	// Welcome route
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP School Service",
			"version": "v1.0.0",
			"status":  "running",
			"endpoints": fiber.Map{
				"health":  "/health",
				"schools": "/api/v1/schools",
			},
		})
	})

	// Setup routes
	routes.SetupRoutes(app, mainDB, tenantManager)

	// Serve static files (uploaded logos)
	app.Static("/uploads", "/app/uploads")

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "school-service",
		})
	})

	// 404 handler
	app.All("*", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Route not found",
		})
	})

	// Start server with graceful shutdown
	port := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Starting School Service on port %d...\n", cfg.Port)

	// Create a channel to listen for OS signals
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := app.Listen(port); err != nil {
			log.Fatalf("Failed to start server: %v\n", err)
		}
	}()

	log.Println("Server started")

	// Block until a signal is received
	<-c
	log.Println("Gracefully shutting down...")
	_ = app.Shutdown()

	log.Println("Running cleanup tasks...")
	// Close tenant connections
	tenantManager.CloseAllConnections()
	// mainDB.Close() is already deferred in main, but we can rely on that or close here explicitly if we remove defer
	log.Println("Server stopped")
}

// setupMiddleware configures all application middleware
func setupMiddleware(app *fiber.App) {
	// Logger middleware
	app.Use(logger.New(logger.Config{
		Format: "${time} - ${method} ${path} - ${status} - ${latency}\n",
	}))

	// Recover middleware - catches panics and returns 500
	app.Use(recover.New())

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     getAllowedOrigins(),
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Content-Type,Authorization,X-Requested-With,X-Tenant-Code",
		ExposeHeaders:    "Content-Length,X-Total-Count",
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Custom headers middleware
	app.Use(func(c *fiber.Ctx) error {
		c.Set("X-Service", "school-service")
		return c.Next()
	})
}

// getAllowedOrigins returns list of allowed CORS origins based on environment
func getAllowedOrigins() string {
	env := os.Getenv("ENVIRONMENT")
	if env == "production" {
		return "https://yourdomain.com"
	}
	// Development - allow all local origins
	return "*"
}
