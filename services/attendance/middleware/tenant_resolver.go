package middleware

import (
	"context"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/attendance/database"
	"school-erp/attendance/pkg/tenant"
)

// TenantContext key for storing tenant information in request context
const (
	TenantCodeContextKey = "tenant_code"
	TenantDBContextKey   = "tenant_db"
)

// TenantResolverConfig holds configuration for the tenant resolver middleware
type TenantResolverConfig struct {
	TenantManager *tenant.TenantManager
	MainDB        *pgxpool.Pool // Main database for school metadata lookup
	DBHost        string
	DBPort        int
}

// NewTenantResolver creates a new tenant resolver middleware
func NewTenantResolver(cfg TenantResolverConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Skip tenant resolution for non-protected endpoints
		if shouldSkipTenantResolution(c) {
			return c.Next()
		}

		// Extract tenant code from request
		tenantCode := extractTenantCode(c)
		if tenantCode == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Tenant code is required",
				"details": "Provide tenant code via header (X-Tenant-Code), query parameter (tenant_code), or subdomain",
			})
		}

		// Skip DB resolution for "system" tenant (Super Admin context)
		if tenantCode == "system" {
			c.Locals(TenantCodeContextKey, tenantCode)
			return c.Next()
		}

		ctx := context.Background()

		// Fetch school credentials from main database
		var dbUser, encryptedPassword string
		query := `SELECT db_user, db_password FROM schools WHERE code = $1 AND status = 'active'`
		err := cfg.MainDB.QueryRow(ctx, query, tenantCode).Scan(&dbUser, &encryptedPassword)
		if err != nil {
			log.Printf("School not found or inactive for tenant %s: %v\n", tenantCode, err)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":       "School not found or inactive",
				"tenant_code": tenantCode,
			})
		}

		// Get or create tenant database connection
		tenantDB, err := cfg.TenantManager.GetConnection(
			ctx,
			tenantCode,
			cfg.DBHost,
			cfg.DBPort,
			fmt.Sprintf("school_%s_db", tenantCode),
			dbUser,
			encryptedPassword,
			database.RunMigrations, // Run migrations on new connection
		)

		if err != nil {
			log.Printf("Failed to get tenant database connection for tenant %s: %v\n", tenantCode, err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":       "Failed to connect to tenant database",
				"tenant_code": tenantCode,
			})
		}

		// Store tenant info in context
		c.Locals(TenantCodeContextKey, tenantCode)
		c.Locals(TenantDBContextKey, tenantDB)

		return c.Next()
	}
}

func extractTenantCode(c *fiber.Ctx) string {
	if tenantCode := c.Get("X-Tenant-Code"); tenantCode != "" {
		return tenantCode
	}
	if tenantCode := c.Query("tenant_code"); tenantCode != "" {
		return tenantCode
	}
	return ""
}

func shouldSkipTenantResolution(c *fiber.Ctx) bool {
	path := c.Path()
	skipPaths := []string{
		"/health",
		"/metrics",
		"/api/v1/docs",
	}

	for _, skipPath := range skipPaths {
		if path == skipPath {
			return true
		}
	}

	return false
}

// GetTenantDB retrieves the tenant database connection from request context
func GetTenantDB(c *fiber.Ctx) *pgxpool.Pool {
	if tenantDB, ok := c.Locals(TenantDBContextKey).(*pgxpool.Pool); ok {
		return tenantDB
	}
	return nil
}
