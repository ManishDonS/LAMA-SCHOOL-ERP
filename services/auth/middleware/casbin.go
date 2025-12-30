package middleware

import (
	"school-erp/auth/pkg/casbin"

	"github.com/gofiber/fiber/v2"
)

// CasbinMiddleware enforces permissions using Casbin
// obj: the resource being accessed (e.g., "students")
// act: the action being performed (e.g., "view", "create", "update", "delete")
func CasbinMiddleware(obj string, act string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("user_id").(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User not authenticated",
			})
		}

		schoolID, ok := c.Locals("school_id").(string)
		if !ok || schoolID == "" {
			// Fallback to "system" domain if school_id is not available
			schoolID = "system"
		}

		// Check permission: Enforce(sub, dom, obj, act)
		allowed, err := casbin.Enforcer.Enforce(userID, schoolID, obj, act)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Authorization check failed",
				"details": err.Error(),
			})
		}

		if !allowed {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Insufficient permissions for this resource",
			})
		}

		return c.Next()
	}
}
