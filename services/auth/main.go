package main

import (
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"school-erp/auth/config"
	"school-erp/auth/database"
	_ "school-erp/auth/docs" // load API Docs files (will be created by swag init)
	"school-erp/auth/messaging"
	"school-erp/auth/middleware"
	"school-erp/auth/pkg/logger"
	"school-erp/auth/pkg/monitoring"
	"school-erp/auth/pkg/tenant"
	"school-erp/auth/routes"
	"school-erp/auth/utils"
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

		// Exact match (case-sensitive for security)
		if allowed == origin {
			return true
		}
	}
	return false
}

// @title School ERP Auth Service
// @version 1.0
// @description Authentication Service for LAMA School ERP
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@lama-erp.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:3001
// @BasePath /api/v1/auth
func main() {
	// Load environment variables
	godotenv.Load()

	// Initialize configuration
	cfg := config.LoadConfig()

	// Initialize structured logger
	logger.InitLogger(cfg.Environment)
	log := logger.GetLogger()

	log.Info().Msg("Starting Auth Service initialization")

	// Initialize database
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database")
	}
	defer db.Close()
	log.Info().Msg("Database connection established")

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatal().Err(err).Msg("Failed to run migrations")
	}
	log.Info().Msg("Database migrations completed")

	// Seed super admin
	if err := utils.SeedSuperAdmin(db, cfg); err != nil {
		log.Error().Err(err).Msg("Failed to seed super admin")
	}

	// Connect to NATS
	messaging.ConnectNATS()
	defer messaging.NatsConnection.Close()
	log.Info().Msg("NATS connection established")

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "School ERP Auth Service",
	})

	// Setup middleware
	setupMiddleware(app)

	// Initialize Tenant Manager
	tenantManager, err := tenant.NewTenantManager(
		cfg.EncryptionKey,
		10, // Max open conns
		5,  // Max idle conns
		5*time.Minute,
		cfg.DBPassword,
	)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize tenant manager")
	}

	// Register Tenant Resolver Middleware
	app.Use(middleware.NewTenantResolver(middleware.TenantResolverConfig{
		TenantManager: tenantManager,
		MainDB:        db,
	}))

	// Swagger Route
	app.Get("/swagger/*", swagger.HandlerDefault)

	// Welcome route
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP Auth Service",
			"version": "v1.0.0",
			"status":  "running",
			"endpoints": fiber.Map{
				"health":   "/health",
				"metrics":  "/metrics",
				"auth":     "/api/v1/auth",
				"register": "/api/v1/auth/register",
				"login":    "/api/v1/auth/login",
				"refresh":  "/api/v1/auth/refresh",
			},
		})
	})

	// Setup routes
	routes.SetupRoutes(app, db)

	// Health check with monitoring
	app.Get("/health", func(c *fiber.Ctx) error {
		health := monitoring.GetMetrics().Health()
		status := health["status"].(string)

		httpStatus := fiber.StatusOK
		switch status {
		case "unhealthy":
			httpStatus = fiber.StatusServiceUnavailable
		case "degraded":
			httpStatus = fiber.StatusOK // Still return 200 but indicate degraded state
		}

		return c.Status(httpStatus).JSON(fiber.Map{
			"status":  status,
			"service": "auth",
			"health":  health,
		})
	})

	// Metrics endpoint with comprehensive stats
	app.Get("/metrics", func(c *fiber.Ctx) error {
		stats := monitoring.GetMetrics().GetStats()
		return c.JSON(fiber.Map{
			"service": "auth",
			"status":  "operational",
			"metrics": stats,
		})
	})

	// Start server with graceful shutdown
	port := cfg.Port
	log.Info().Str("port", port).Msg("Starting Auth Service")

	// Create a channel to listen for OS signals
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + port); err != nil {
			log.Fatal().Err(err).Msg("Error starting server")
		}
	}()

	log.Info().Msg("Server started successfully")

	// Block until a signal is received
	<-c
	log.Info().Msg("Shutdown signal received, gracefully shutting down...")
	_ = app.Shutdown()

	log.Info().Msg("Running cleanup tasks...")
	// Your cleanup tasks go here
	// db.Close() is already deferred in main
	log.Info().Msg("Server stopped successfully")
}

func setupMiddleware(app *fiber.App) {
	// Request ID middleware
	app.Use(func(c *fiber.Ctx) error {
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Locals("request_id", requestID)
		c.Set("X-Request-ID", requestID)
		return c.Next()
	})

	// Structured logger middleware
	app.Use(func(c *fiber.Ctx) error {
		start := time.Now()
		requestID := c.Locals("request_id").(string)

		// Process request
		err := c.Next()

		// Log request
		log := logger.WithContext(requestID, c.Method(), c.Path(), c.IP())

		duration := time.Since(start)
		status := c.Response().StatusCode()

		logEvent := log.Info()
		if status >= 500 {
			logEvent = log.Error()
		} else if status >= 400 {
			logEvent = log.Warn()
		}

		logEvent.
			Int("status", status).
			Str("method", c.Method()).
			Str("path", c.Path()).
			Dur("duration_ms", duration).
			Str("user_agent", c.Get("User-Agent")).
			Msg("HTTP request")

		return err
	})

	// CORS middleware with improved security
	app.Use(func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		allowedOrigins := os.Getenv("CORS_ALLOW_ORIGINS")
		if allowedOrigins == "" {
			// Default to localhost only in development
			if os.Getenv("ENVIRONMENT") == "production" {
				// In production, CORS_ALLOW_ORIGINS must be explicitly set
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"error": "CORS not configured for production",
				})
			}
			allowedOrigins = "http://localhost:3000,http://localhost:3001"
		}

		// Only set CORS headers if origin is explicitly allowed
		if origin != "" && contains(allowedOrigins, origin) {
			c.Set("Access-Control-Allow-Origin", origin) // Never use "*" with credentials
			c.Set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS,PATCH")
			c.Set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,x-tenant-code")
			c.Set("Access-Control-Allow-Credentials", "true")
			c.Set("Access-Control-Max-Age", "7200") // Cache preflight for 2 hours
		} else if origin != "" {
			// Origin present but not allowed - reject
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Origin not allowed",
			})
		}

		// Handle preflight requests
		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusNoContent)
		}
		return c.Next()
	})
}
