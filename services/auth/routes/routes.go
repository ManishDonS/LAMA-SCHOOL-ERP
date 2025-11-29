package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/auth/config"
	"school-erp/auth/handlers"
	"school-erp/auth/middleware"
)

func SetupRoutes(app *fiber.App, db *pgxpool.Pool) {
	cfg := config.LoadConfig()
	authHandler := handlers.NewAuthHandler(db, cfg)

	// Create rate limiters
	authRateLimiter := middleware.AuthRateLimiter()
	generalRateLimiter := middleware.GeneralRateLimiter()

	// Public routes
	api := app.Group("/api/v1")
	auth := api.Group("/auth")

	// Apply strict rate limiting to auth endpoints
	auth.Post("/register", authRateLimiter.Middleware(), authHandler.Register)
	auth.Post("/login", authRateLimiter.Middleware(), authHandler.Login)
	auth.Post("/refresh", authRateLimiter.Middleware(), authHandler.RefreshToken)

	// Protected routes
	protected := auth.Group("")
	protected.Use(middleware.JWTMiddleware(cfg))
	protected.Use(generalRateLimiter.Middleware()) // Less strict for authenticated users

	protected.Get("/me", authHandler.GetMe)
	protected.Post("/logout", authHandler.Logout)

	// Admin routes
	admin := api.Group("/admin")
	admin.Use(middleware.JWTMiddleware(cfg))
	admin.Use(middleware.RoleMiddleware("admin"))

	// Admin endpoints can be added here
	admin.Get("/users", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Admin users endpoint",
		})
	})
}
