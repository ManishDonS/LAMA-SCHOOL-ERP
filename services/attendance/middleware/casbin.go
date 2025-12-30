package middleware

import (
	"school-erp/attendance/pkg/casbin"
	"school-erp/attendance/pkg/logger"

	"github.com/gofiber/fiber/v2"
)

// CasbinMiddleware enforces permissions using Casbin
// obj: the resource being accessed (e.g., "attendance")
// act: the action being performed (e.g., "view", "create", "update", "delete")
func CasbinMiddleware(obj string, act string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User role not found in token",
			})
		}

		schoolID, ok := c.Locals("school_id").(string)
		if !ok || schoolID == "" {
			// Fallback to "system" domain if school_id is not available
			schoolID = "system"
		}

		// Check permission: Enforce(sub, dom, obj, act)
		if casbin.Enforcer == nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Authorization enforcer not initialized",
			})
		}

		// Debugging info
		log := logger.GetLogger()
		log.Debug().
			Str("sub", role).
			Str("dom", schoolID).
			Str("obj", obj).
			Str("act", act).
			Msg("Checking Casbin permission")

		allowed, err := casbin.Enforcer.Enforce(role, schoolID, obj, act)
		if err != nil {
			log.Error().Err(err).Msg("Casbin enforcement error")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Authorization check failed",
				"details": err.Error(),
			})
		}

		if !allowed {
			// Log the denied request for debugging
			log.Warn().
				Str("sub", role).
				Str("dom", schoolID).
				Str("obj", obj).
				Str("act", act).
				Msg("Casbin permission DENIED")
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Insufficient permissions for this resource",
				"debug": fiber.Map{
					"sub": role,
					"dom": schoolID,
					"obj": obj,
					"act": act,
				},
			})
		}

		return c.Next()
	}
}
