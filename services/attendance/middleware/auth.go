package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"school-erp/attendance/messaging"
	"school-erp/attendance/utils"
)

// AuthMiddleware extracts and verifies the JWT token from the Authorization header
func AuthMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing authorization header"})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid authorization header format"})
	}

	token := parts[1]
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Empty token"})
	}

	claims, err := utils.VerifyToken(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	// Store claims in context for use in handlers and other middlewares
	c.Locals("user_id", claims.UserID)
	c.Locals("school_id", claims.SchoolID)
	c.Locals("role", claims.Role)
	c.Locals("email", claims.Email)

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

		// 2. Fallback: Get active modules (set by TenantResolver from DB)
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
