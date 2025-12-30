package middleware

import (
	"context"
	"log"

	"school-erp/expense/database"
	"school-erp/expense/pkg/tenant"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	TenantDBContextKey   = "tenant_db"
	TenantCodeContextKey = "tenant_code"
)

type TenantResolverConfig struct {
	MainDB        *pgxpool.Pool
	TenantManager *tenant.TenantManager
	DBHost        string
	DBPort        int
}

func TenantResolver(cfg TenantResolverConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Extract tenant code
		tenantCode := c.Get("X-Tenant-Code")
		if tenantCode == "" {
			tenantCode = c.Query("tenant_code")
		}

		if tenantCode == "" {
			// For testing or special cases, we might want a default or return error
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing tenant code",
			})
		}

		// 2. Resolve tenant database credentials from main DB
		var dbUser, encryptedPassword, dbName string
		query := `SELECT db_user, db_password, db_name FROM schools WHERE code = $1 AND status = 'active'`
		err := cfg.MainDB.QueryRow(context.Background(), query, tenantCode).Scan(&dbUser, &encryptedPassword, &dbName)
		if err != nil {
			log.Printf("Tenant resolution failed for %s: %v", tenantCode, err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or inactive tenant",
			})
		}

		// 3. Get connection from manager
		tenantDB, err := cfg.TenantManager.GetConnection(
			context.Background(),
			tenantCode,
			cfg.DBHost,
			cfg.DBPort,
			dbName,
			dbUser,
			encryptedPassword,
			database.RunMigrations,
		)

		if err != nil {
			log.Printf("Failed to connect to tenant database %s: %v", tenantCode, err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to connect to tenant database",
			})
		}

		// 4. Store in context
		c.Locals(TenantDBContextKey, tenantDB)
		c.Locals(TenantCodeContextKey, tenantCode)

		return c.Next()
	}
}

func GetTenantDB(c *fiber.Ctx) *pgxpool.Pool {
	db, ok := c.Locals(TenantDBContextKey).(*pgxpool.Pool)
	if !ok {
		return nil
	}
	return db
}

func GetTenantCode(c *fiber.Ctx) string {
	code, ok := c.Locals(TenantCodeContextKey).(string)
	if !ok {
		return ""
	}
	return code
}
