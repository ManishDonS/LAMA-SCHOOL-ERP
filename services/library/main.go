package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"

	"strconv"
	"time"

	"school-erp/library/config"
	"school-erp/library/database"
	"school-erp/library/middleware"
	"school-erp/library/pkg/tenant"
	"school-erp/library/routes"

	"github.com/gofiber/swagger"
)

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

	app := fiber.New(fiber.Config{AppName: "School ERP Library Service"})
	setupMiddleware(app)

	// Swagger Route
	app.Get("/swagger/*", swagger.HandlerDefault)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "School ERP Library Service",
			"version": "v1.0.0",
			"status":  "running",
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

	routes.SetupRoutes(app, db, cfg, tenantManager)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "library"})
	})

	port := cfg.Port
	log.Printf("Starting Library Service on port %s\n", port)
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
			allowedOrigins = "http://localhost:3000"
		}
		if contains(allowedOrigins, origin) {
			c.Set("Access-Control-Allow-Origin", origin)
			c.Set("Access-Control-Allow-Credentials", "true")
		}
		c.Set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Content-Type,Authorization,x-tenant-code")
		if c.Method() == "OPTIONS" {
			return c.SendStatus(204)
		}
		return c.Next()
	})
}
