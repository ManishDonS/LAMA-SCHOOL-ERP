package main

import (
	"context"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"school-erp/attendance/config"
	"school-erp/attendance/database"
	"school-erp/attendance/messaging"
	"school-erp/attendance/middleware"
	"school-erp/attendance/pkg/casbin"
	"school-erp/attendance/pkg/logger"
	"school-erp/attendance/pkg/tenant"
	"school-erp/attendance/routes"
)

func main() {
	godotenv.Load()
	cfg := config.LoadConfig()

	// Initialize Logger
	logger.InitLogger()
	log := logger.GetLogger()

	log.Info().Msg("Initializing Attendance Service")

	// Initialize Main Database (for school metadata)
	mainDB, err := database.InitDB(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize main database")
	}
	defer mainDB.Close()

	// Initialize Casbin Enforcer
	if err := casbin.InitEnforcer(mainDB); err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize Casbin enforcer")
	}

	// Initialize Tenant Manager
	dbPort, _ := strconv.Atoi(cfg.DBPort)
	tm, err := tenant.NewTenantManager(
		os.Getenv("ENCRYPTION_KEY"),
		10,
		5,
		time.Hour,
		cfg.DBPassword,
	)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create tenant manager")
	}

	messaging.ConnectNATS()
	if messaging.NatsConnection != nil {
		messaging.SubscribeModuleUpdates()
		defer messaging.NatsConnection.Close()
	}

	app := fiber.New(fiber.Config{
		AppName: "School ERP Attendance Service",
		// Use custom errorHandler for structured logging of errors
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			log.Error().Err(err).
				Str("path", c.Path()).
				Str("method", c.Method()).
				Int("status", code).
				Msg("Request failed")
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	setupMiddleware(app, cfg)

	// Setup Tenant Resolver Middleware
	tenantResolver := middleware.NewTenantResolver(middleware.TenantResolverConfig{
		TenantManager: tm,
		MainDB:        mainDB,
		DBHost:        cfg.DBHost,
		DBPort:        dbPort,
	})

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP Attendance Service",
			"version": "v1.0.0",
			"status":  "running",
		})
	})

	// Setup Routes with multi-tenancy support
	routes.SetupRoutes(app, mainDB, cfg, tm, tenantResolver)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "attendance"})
	})

	// Start server in a goroutine
	go func() {
		port := cfg.Port
		log.Info().Str("port", port).Msg("Starting Attendance Service")
		if err := app.Listen(":" + port); err != nil {
			log.Fatal().Err(err).Msg("Error starting server")
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit
	log.Info().Msg("Shutting down Attendance Service...")

	// Create a context with a timeout for shutdown
	_, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.Shutdown(); err != nil {
		log.Error().Err(err).Msg("Fiber shutdown error")
	}

	log.Info().Msg("Attendance Service gracefully stopped")
}

func setupMiddleware(app *fiber.App, cfg *config.Config) {
	// Request ID Middleware
	app.Use(middleware.RequestIDMiddleware())

	// Logging middleware
	app.Use(func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		duration := time.Since(start)

		log := logger.GetLogger()
		log.Info().
			Str("request_id", c.Locals("request_id").(string)).
			Str("method", c.Method()).
			Str("path", c.Path()).
			Str("ip", c.IP()).
			Int("status", c.Response().StatusCode()).
			Dur("duration", duration).
			Msg("HTTP Request")

		return err
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
