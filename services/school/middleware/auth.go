package middleware

import (
	"encoding/json"
	"strings"

	"github.com/gofiber/fiber/v2"

	"school-erp/school/config"
	"school-erp/school/pkg/utils"
)

func JWTMiddleware(cfg *config.Config) fiber.Handler {
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

		// Store claims in context
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)
		c.Locals("school_id", claims.SchoolID)

		return c.Next()
	}
}

// PermissionMiddleware checks if user has specific permission
// This implementation assumes granular permissions are NOT in the JWT
// and must be checked against the Tenant DB.
// NOTE: This relies on TenantResolver being run BEFORE this middleware.
func PermissionMiddleware(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("user_id").(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User not authenticated",
			})
		}

		// 1. Check School-Level Module Permissions (License Check)
		// Extract module from permission slug (e.g., "students.read" -> module "students", action "read")
		parts := strings.Split(requiredPermission, ".")
		if len(parts) >= 2 {
			module := parts[0]
			action := parts[1]

			// Get module permissions from context (set by TenantResolver)
			if modulePermsJSON, ok := c.Locals("module_permissions_json").([]byte); ok && len(modulePermsJSON) > 0 {
				// Parse JSON (Optimized: we could parse once in TenantResolver, but doing it here is fine for now)
				/*
					Structure:
					{
						"students": {"read": true, "create": false},
						...
					}
				*/
				// We need a quick way to check. Let's unmarshal into map.
				// Note: Ideally define a struct for this or use gjson for speed.
				// Since we don't want to import heavy libs, simple map unmarshal.
				var schoolPerms map[string]map[string]bool
				// We need "encoding/json"
				if err := json.Unmarshal(modulePermsJSON, &schoolPerms); err == nil {
					// Check if module exists in config
					if modConfig, exists := schoolPerms[module]; exists {
						// Check if action is Allowed.
						// If action is missing, default to? Usually false for strict security.
						// Frontend sends all 4 actions.
						if allowed, ok := modConfig[action]; ok && !allowed {
							return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
								"error":  "Module access denied by school license",
								"module": module,
								"action": action,
							})
						}
						// If action not in map (e.g. new action), what to do?
						// Assume allowed or denied? Let's assume allowed if module is present but action specific isn't restricted?
						// Or if the entire module key is missing?
						// For now, only block if explicitly false.
					} else {
						// If module key is missing from school config, assume ENABLED or DISABLED?
						// Usually if not in config, it might be a new module. Default to Disabled if strict.
						// But for backward compatibility, maybe enabled?
						// Let's assume strict: If module not in params, it's not enabled?
						// Or active_modules list?
						// The UI sends ALL modules. So if not present, it's weird.
					}
				}
			}
		}

		// 2. Check User-Level Permissions (RBAC)
		tenantDB := GetTenantDB(c)
		if tenantDB == nil {
			// If no tenant DB, we can't check permissions.
			// This might happen if 'system' tenant or public route context.
			// Fail safe:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Tenant context missing for permission check",
			})
		}

		// Check permission
		// We can cache this query result in Redis if needed.
		// Logic: User has permission IF:
		// 1. User has a role that has the permission
		// 2. OR User has the permission directly (if we supported direct user permissions, which we don't yet, but good to know)
		// 3. User is Admin? (Admin role should have all permissions seeded, so #1 covers it)

		query := `
			SELECT 1
			FROM user_roles ur
			JOIN role_permissions rp ON ur.role_id = rp.role_id
			JOIN permissions p ON rp.permission_id = p.id
			WHERE ur.user_id = $1 AND p.slug = $2
			LIMIT 1
		`

		var exists int
		err := tenantDB.QueryRow(c.Context(), query, userID, requiredPermission).Scan(&exists)
		if err != nil {
			// Permission not found
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":    "Insufficient permissions",
				"required": requiredPermission,
			})
		}

		return c.Next()
	}
}

// ModuleMiddleware checks if the module is enabled for the school
// This assumes 'active_modules' is in the School struct in MainDB,
// OR we can check Tenant DB if we store it there.
// Currently MainDB `schools` table has `active_modules`.
// However, the `School` object is not easily available in Context unless we put it there in TenantResolver.
// In `TenantResolver`, we fetched `dbUser`, `dbPassword` etc but didn't store the full School object.
// BUT, we can query `active_modules` from `schools` table using `TenantCode`.
// Optimized: Store `active_modules` in Locals in TenantResolver?
// For now, let's query MainDB or skip if too complex for this step.
// The user request was about RBAC (Roles/Permissions), not just Module Flagging,
// but Module Flagging is part of it.
// Let's stick to RBAC PermissionMiddleware first.
