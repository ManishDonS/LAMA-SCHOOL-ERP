package middleware

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v2"

	"school-erp/auth/config"
	"school-erp/auth/pkg/casbin"
	"school-erp/auth/utils"
)

type Blacklist interface {
	IsJTIBlacklisted(ctx context.Context, jti string) (bool, error)
}

func JWTMiddleware(cfg *config.Config, blacklist Blacklist) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		tokenString := parts[1]

		// Verify token
		claims, err := utils.VerifyToken(cfg, tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Check if token's JTI is blacklisted
		if blacklist != nil && claims.JTI != "" {
			isBlacklisted, err := blacklist.IsJTIBlacklisted(c.Context(), claims.JTI)
			if err != nil {
				// Log error but proceed? Or fail? Let's fail for safety
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "Failed to verify token status",
				})
			}
			if isBlacklisted {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "Token has been revoked",
				})
			}
		}

		// Store claims in context
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)
		c.Locals("school_id", claims.SchoolID)
		c.Locals("jti", claims.JTI)
		c.Locals("exp", claims.ExpiresAt.Time)

		return c.Next()
	}
}

// RoleMiddleware is DEPRECATED. Use CasbinMiddleware instead.
// It remains for temporary backward compatibility during migration.
func RoleMiddleware(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("user_id").(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User not authenticated",
			})
		}

		userRole, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User role not found",
			})
		}

		schoolID, ok := c.Locals("school_id").(string)
		if !ok || schoolID == "" {
			schoolID = "system"
		}

		// First, try direct Casbin check for 'access' act on 'system' obj
		// This follows the new granular model
		allowed, err := casbin.Enforcer.Enforce(userID, schoolID, "system", "access")
		if err == nil && allowed {
			return c.Next()
		}

		// Fallback to legacy role behavior for backward compatibility
		for _, role := range allowedRoles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions",
		})
	}
}
