package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"

	"strconv"
	"time"

	"github.com/gofiber/fiber/v2/middleware/cors"

	"school-erp/student/config"
	"school-erp/student/database"
	_ "school-erp/student/docs" // load API Docs files
	"school-erp/student/messaging"
	"school-erp/student/middleware"
	"school-erp/student/pkg/tenant"
	"school-erp/student/routes"
	"school-erp/student/service"

	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/swagger"
)

// @title School ERP Student Service
// @version 1.0
// @description REST API for Student Management in LAMA School ERP
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@lama-erp.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:3003
// @BasePath /api/v1
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
	defer messaging.NatsConnection.Close()

	app := fiber.New(fiber.Config{AppName: "School ERP Student Service"})
	setupMiddleware(app, cfg)

	// Rate Limiting
	app.Use(limiter.New(limiter.Config{
		Max:        60,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests, please try again later.",
			})
		},
	}))

	// Swagger Route
	app.Get("/swagger/*", swagger.HandlerDefault)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP Student Service",
			"version": "v1.0.0",
			"status":  "running",
			"endpoints": fiber.Map{
				"health":   "/health",
				"metrics":  "/metrics",
				"students": "/api/v1/students",
				"docs":     "/swagger/index.html",
			},
		})
	})

	// Initialize Tenant Manager
	tenantManager, err := tenant.NewTenantManager(
		cfg.EncryptionKey,
		10, // Max open conns
		5,  // Max idle conns
		5*time.Minute,
		cfg.DBPassword,
	)
	if err != nil {
		log.Fatalf("Failed to initialize tenant manager: %v", err)
	}

	// Register Tenant Resolver Middleware
	dbPort, _ := strconv.Atoi(cfg.DBPort)
	app.Use(middleware.NewTenantResolver(middleware.TenantResolverConfig{
		TenantManager: tenantManager,
		MainDB:        db,
		DBHost:        cfg.DBHost,
		DBPort:        dbPort,
	}))

	// Initialize Student Service
	studentService := service.NewStudentService(cfg.AuthServiceURL)

	routes.SetupRoutes(app, db, cfg, tenantManager, studentService)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "student"})
	})
	app.Get("/metrics", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"uptime": "N/A", "status": "operational"})
	})

	port := cfg.Port
	log.Printf("Starting Student Service on port %s\n", port)
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
			AllowOrigins:     cfg.AllowedOrigins,
			AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS,PATCH",
			AllowHeaders:     "Content-Type,Authorization,X-Requested-With,x-tenant-code",
			AllowCredentials: true,
			MaxAge:           7200,
		}))
	}
}
