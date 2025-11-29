package middleware

import (
	"context"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/school/pkg/tenant"
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

// TenantInfo holds tenant-specific information extracted from request
type TenantInfo struct {
	Code     string
	Database *pgxpool.Pool
}

// NewTenantResolver creates a new tenant resolver middleware
// This middleware resolves the tenant code from the request and loads the appropriate database connection
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
				"error": "Tenant code is required",
				"details": "Provide tenant code via header (X-Tenant-Code), query parameter (tenant_code), or subdomain",
			})
		}

		ctx := context.Background()

		// Fetch school credentials from main database
		var dbUser, encryptedPassword string
		query := `SELECT db_user, db_password FROM schools WHERE code = $1 AND status = 'active'`
		err := cfg.MainDB.QueryRow(ctx, query, tenantCode).Scan(&dbUser, &encryptedPassword)
		if err != nil {
			log.Printf("School not found or inactive for tenant %s: %v\n", tenantCode, err)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "School not found or inactive",
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
		)

		if err != nil {
			log.Printf("Failed to get tenant database connection for tenant %s: %v\n", tenantCode, err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to connect to tenant database",
				"tenant_code": tenantCode,
			})
		}

		// Store tenant info in context
		c.Locals(TenantCodeContextKey, tenantCode)
		c.Locals(TenantDBContextKey, tenantDB)

		// Also set it in the request context for downstream handlers
		ctx = context.WithValue(ctx, TenantCodeContextKey, tenantCode)
		ctx = context.WithValue(ctx, TenantDBContextKey, tenantDB)

		return c.Next()
	}
}

// extractTenantCode extracts tenant code from request in the following order:
// 1. X-Tenant-Code header
// 2. tenant_code query parameter
// 3. From subdomain (e.g., "eis.school-erp.com" -> "eis")
func extractTenantCode(c *fiber.Ctx) string {
	// Try header first
	if tenantCode := c.Get("X-Tenant-Code"); tenantCode != "" {
		return tenantCode
	}

	// Try query parameter
	if tenantCode := c.Query("tenant_code"); tenantCode != "" {
		return tenantCode
	}

	// Try from subdomain
	if tenantCode := extractSubdomain(c.Hostname()); tenantCode != "" {
		return tenantCode
	}

	return ""
}

// extractSubdomain extracts tenant code from subdomain
// Example: "eis.school-erp.com" -> "eis"
func extractSubdomain(hostname string) string {
	// Parse hostname to get subdomain
	// This is a simple implementation - you may need to adjust based on your domain structure
	if hostname == "" || hostname == "localhost" {
		return ""
	}

	// For localhost:port, return empty
	if hostname == "localhost" || (len(hostname) > 0 && hostname[0] == '[') {
		return ""
	}

	// Simple subdomain extraction
	// If hostname is "eis.school-erp.com" or "eis.localhost:3000"
	parts := make([]rune, 0)
	for _, c := range hostname {
		if c == '.' || c == ':' {
			break
		}
		parts = append(parts, c)
	}

	subdomain := string(parts)
	if subdomain == "www" || subdomain == "api" || subdomain == "" {
		return ""
	}

	return subdomain
}

// shouldSkipTenantResolution returns true if the request should skip tenant resolution
// This includes health checks, public endpoints, and metadata operations
func shouldSkipTenantResolution(c *fiber.Ctx) bool {
	path := c.Path()

	// Skip tenant resolution for these paths
	skipPaths := []string{
		"/health",
		"/api/v1/schools",           // SuperAdmin school management doesn't need tenant resolution
		"/api/v1/schools/",          // SuperAdmin operations
		"/api/v1/auth",              // Authentication endpoints
		"/api/v1/metrics",           // Metrics endpoint
		"/api/v1/readiness",         // Readiness probe
		"/api/v1/liveness",          // Liveness probe
	}

	for _, skipPath := range skipPaths {
		if path == skipPath || (len(skipPath) > 0 && skipPath[len(skipPath)-1] == '/' && len(path) > len(skipPath) && path[:len(skipPath)] == skipPath) {
			return true
		}
	}

	// For POST/PUT/DELETE to /api/v1/schools, skip (SuperAdmin operations)
	if (c.Method() == "POST" || c.Method() == "PUT" || c.Method() == "DELETE") && path == "/api/v1/schools" {
		return true
	}

	return false
}

// GetTenantCode retrieves the tenant code from request context
func GetTenantCode(c *fiber.Ctx) string {
	if tenantCode, ok := c.Locals(TenantCodeContextKey).(string); ok {
		return tenantCode
	}
	return ""
}

// GetTenantDB retrieves the tenant database connection from request context
func GetTenantDB(c *fiber.Ctx) *pgxpool.Pool {
	if tenantDB, ok := c.Locals(TenantDBContextKey).(*pgxpool.Pool); ok {
		return tenantDB
	}
	return nil
}

// TenantErrorHandler handles tenant-related errors
func TenantErrorHandler(c *fiber.Ctx, err error) error {
	log.Printf("Tenant middleware error: %v\n", err)
	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"error": "Internal server error",
		"message": "Failed to process tenant request",
	})
}
