package routes

import (
	"time"

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
	// Relaxed IP-based rate limit for general auth endpoints
	authRateLimiter := middleware.NewRateLimiter(50, 15*time.Minute)

	// Strict account-specific rate limit for login
	loginRateLimiter := middleware.NewRateLimiter(5, 15*time.Minute)
	loginRateLimiter.KeyFunc = func(c *fiber.Ctx) string {
		tenantCode := middleware.GetTenantCode(c)
		var loginReq struct {
			Email string `json:"email"`
		}
		// We use BodyParser here, but since it's a small struct and Fiber/FastHTTP
		// might have issues with multiple parses if not careful, we should be aware.
		// However, handlers usually call BodyParser again.
		if err := c.BodyParser(&loginReq); err == nil && loginReq.Email != "" {
			return tenantCode + ":" + loginReq.Email
		}
		return ""
	}

	generalRateLimiter := middleware.GeneralRateLimiter()

	// Public routes
	api := app.Group("/api/v1")
	auth := api.Group("/auth")

	// Apply strict rate limiting to auth endpoints
	auth.Post("/register", authRateLimiter.Middleware(), authHandler.Register)
	auth.Post("/login", loginRateLimiter.Middleware(), authHandler.Login)
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
