package main

import (
	"log"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	"school-erp/class/config"
	"school-erp/class/database"
	"school-erp/class/handlers"
	"school-erp/class/middleware"
	"school-erp/class/pkg/tenant"
)

func main() {
	cfg := config.LoadConfig()

	// 1. Initialize Main DB
	mainDB, err := database.InitDB(cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)
	if err != nil {
		log.Fatalf("Failed to connect to main database: %v", err)
	}
	defer mainDB.Close()

	// 2. Initialize Tenant Manager
	tm, err := tenant.NewTenantManager(
		cfg.EncryptionKey,
		10, // Max open conns
		5,  // Max idle conns
		5*time.Minute,
		cfg.DBPassword,
	)
	if err != nil {
		log.Fatalf("Failed to create tenant manager: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName: "School ERP Class Service",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	h := handlers.NewHandler(mainDB)

	// Routes
	app.Get("/health", h.Health)

	api := app.Group("/api/v1")

	// Tenant Resolver Middleware
	dbPort, _ := strconv.Atoi(cfg.DBPort)
	api.Use(middleware.TenantResolver(middleware.TenantResolverConfig{
		MainDB:        mainDB,
		TenantManager: tm,
		DBHost:        cfg.DBHost,
		DBPort:        dbPort,
	}))

	classes := api.Group("/classes")
	classes.Get("/", h.ListClasses)
	classes.Post("/", h.CreateClass)
	classes.Put("/:id", h.UpdateClass)
	classes.Delete("/:id", h.DeleteClass)

	// Academic Year Routes
	ayHandler := handlers.NewAcademicYearHandler(mainDB)
	academicYears := api.Group("/academic-years")
	academicYears.Post("/", ayHandler.CreateAcademicYear)
	academicYears.Get("/", ayHandler.GetAcademicYears)
	academicYears.Put("/:id", ayHandler.UpdateAcademicYear)
	academicYears.Delete("/:id", ayHandler.DeleteAcademicYear)

	log.Printf("[Class Service] Environment: %s, Port: %s", cfg.Environment, cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
