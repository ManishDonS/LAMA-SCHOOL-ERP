package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/school-erp/transport-service/internal/handlers"
	"github.com/school-erp/transport-service/internal/repository"
	"github.com/school-erp/transport-service/internal/service"
)

func main() {
	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "School ERP - Transport Service",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: os.Getenv("CORS_ALLOW_ORIGINS"),
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Database connection
	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	log.Println("Connected to database")

	// Initialize layers
	repo := repository.NewPostgresRepository(pool)
	svc := service.NewTransportService(repo)
	handler := handlers.NewTransportHandler(svc)

	// Routes
	api := app.Group("/api/v1/transport")

	// Bus Routes
	api.Post("/buses", handler.CreateBus)
	api.Get("/buses", handler.ListBuses)
	api.Get("/buses/:id", handler.GetBus)
	api.Put("/buses/:id", handler.UpdateBus)
	api.Delete("/buses/:id", handler.DeleteBus)

	// Driver Routes
	api.Post("/drivers", handler.CreateDriver)
	api.Get("/drivers", handler.ListDrivers)
	api.Get("/drivers/:id", handler.GetDriver)
	api.Put("/drivers/:id", handler.UpdateDriver)
	api.Delete("/drivers/:id", handler.DeleteDriver)

	// Route Routes
	api.Post("/routes", handler.CreateRoute)
	api.Get("/routes", handler.ListRoutes)
	api.Get("/routes/:id", handler.GetRoute)
	api.Put("/routes/:id", handler.UpdateRoute)
	api.Delete("/routes/:id", handler.DeleteRoute)

	// Assignment Routes
	api.Post("/assignments", handler.CreateAssignment)
	api.Get("/assignments", handler.ListAssignments)
	api.Delete("/assignments/:id", handler.DeleteAssignment)

	// Traccar Routes
	api.Get("/traccar/token", handler.GetTraccarToken)
	api.All("/traccar/*", handler.ProxyTraccar)

	// Settings Routes
	api.Get("/settings", handler.GetSettings)
	api.Put("/settings", handler.UpdateSettings)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "transport",
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3009"
	}

	go func() {
		if err := app.Listen(":" + port); err != nil {
			log.Fatalf("Error starting server: %v", err)
		}
	}()

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("Shutting down server...")
	_ = app.Shutdown()
	log.Println("Server stopped")
}
