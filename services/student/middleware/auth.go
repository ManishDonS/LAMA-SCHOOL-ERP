package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func NewAuthMiddleware(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		tokenString := parts[1]
		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Empty token",
			})
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "Unexpected signing method")
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token claims",
			})
		}

		// Store user info in context
		c.Locals("user_id", claims["user_id"])
		c.Locals("email", claims["email"])
		c.Locals("role", claims["role"])
		c.Locals("school_id", claims["school_id"])

		return c.Next()
	}
}

// ModuleAccessMiddleware prevents access to a module if not active for the school
func ModuleAccessMiddleware(moduleKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Super admin bypasses module activation checks
		role, _ := c.Locals("role").(string)
		if role == "super_admin" {
			return c.Next()
		}

		// 2. Get active modules (set by TenantResolver)
		activeModulesJSON, ok := c.Locals("active_modules_json").([]byte)
		if !ok || len(activeModulesJSON) == 0 {
			return c.Next()
		}

		// Minimal check logic (can be replaced with NATS cache later)
		isActive := strings.Contains(string(activeModulesJSON), "\""+moduleKey+"\"")

		if !isActive {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Module not active for this school",
				"module":  moduleKey,
				"message": "Please activate this module in the Apps dashboard or contact support.",
			})
		}

		return c.Next()
	}
}
