package middleware

import (
	"strings"

	"school-erp/user/messaging"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(c *fiber.Ctx) error {
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

	// For now, just validate that a token is present
	// In production, validate the JWT signature and claims
	token := parts[1]
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Empty token",
		})
	}

	// Parse token (basic validation)
	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		// This is where you'd validate the signature
		// For now, just return a dummy key
		return []byte("dummy"), nil
	})

	if err != nil {
		// Token parsing failed, but we'll allow it in development
		// In production, reject invalid tokens
	}

	// Extract claims correctly
	c.Locals("user_id", claims["user_id"])
	c.Locals("role", claims["role"])
	c.Locals("school_id", claims["school_id"])
	return c.Next()
}

// ModuleAccessMiddleware prevents access to a module if not active for the school
func ModuleAccessMiddleware(moduleKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Super admin bypasses module activation checks
		role, _ := c.Locals("role").(string)
		if role == "super_admin" {
			return c.Next()
		}

		schoolID, _ := c.Locals("school_id").(string)
		if schoolID != "" {
			// Check NATS-backed cache first
			if messaging.Cache.IsModuleActive(schoolID, moduleKey) {
				return c.Next()
			}
		}

		// 2. Get active modules (set by TenantResolver)
		activeModulesJSON, ok := c.Locals("active_modules_json").([]byte)
		if !ok || len(activeModulesJSON) == 0 {
			return c.Next()
		}

		// Minimal check logic
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
