package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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
	setupMiddleware(app, cfg)

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
