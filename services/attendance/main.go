package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"

	"school-erp/attendance/config"
	"school-erp/attendance/database"
	"school-erp/attendance/messaging"
	"school-erp/attendance/middleware"
	"school-erp/attendance/pkg/tenant"
	"school-erp/attendance/routes"
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

	// Initialize Main Database (for school metadata)
	mainDB, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize main database: %v", err)
	}
	defer mainDB.Close()

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
		log.Fatalf("Failed to create tenant manager: %v", err)
	}

	messaging.ConnectNATS()
	defer messaging.NatsConnection.Close()

	app := fiber.New(fiber.Config{AppName: "School ERP Attendance Service"})
	setupMiddleware(app)

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
			"endpoints": fiber.Map{
				"health":     "/health",
				"metrics":    "/metrics",
				"attendance": "/api/v1/attendance",
			},
		})
	})

	// Setup Routes with multi-tenancy support
	routes.SetupRoutes(app, mainDB, cfg, tm, tenantResolver)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "attendance"})
	})
	app.Get("/metrics", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"uptime": "N/A", "status": "operational"})
	})

	port := cfg.Port
	log.Printf("Starting Attendance Service on port %s\n", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func setupMiddleware(app *fiber.App) {
	app.Use(func(c *fiber.Ctx) error {
		fmt.Printf("[%s] %s %s\n", c.Method(), c.Path(), c.IP())
		return c.Next()
	})
	app.Use(func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		allowedOrigins := os.Getenv("CORS_ALLOW_ORIGINS")
		if allowedOrigins == "" {
			allowedOrigins = "http://localhost:3000,http://localhost:3001"
		}

		// Check if origin is allowed
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
}
