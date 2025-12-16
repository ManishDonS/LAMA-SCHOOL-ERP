package utils

import (
	"context"
	"school-erp/auth/config"
	"school-erp/auth/pkg/logger"

	"github.com/jackc/pgx/v5/pgxpool"
)

func SeedSuperAdmin(db *pgxpool.Pool, cfg *config.Config) error {
	if cfg.SuperAdminEmail == "" || cfg.SuperAdminPassword == "" {
		logger.GetLogger().Info().Msg("Super admin credentials not provided, skipping seeding")
		return nil
	}

	ctx := context.Background()

	// Create system school if not exists (using UUID)
	systemSchoolID := "00000000-0000-0000-0000-000000000000"
	_, err := db.Exec(ctx, `
		INSERT INTO schools (id, name, code, db_name, db_user, db_password, db_host, db_port, domain, timezone, status)
		VALUES ($1, 'System', 'system', 'system_db', 'system_user', 'system_pass', 'postgres', 5432, 'system.local', 'UTC', 'active')
		ON CONFLICT (code) DO UPDATE SET name = 'System'`,
		systemSchoolID)
	if err != nil {
		return err
	}

	// Hash password
	hashedPassword, err := GeneratePasswordHash(cfg, cfg.SuperAdminPassword)
	if err != nil {
		return err
	}

	// Create or update super admin user
	_, err = db.Exec(ctx, `
		INSERT INTO users (school_id, email, password_hash, first_name, last_name, role, status)
		VALUES ($1, $2, $3, 'Super', 'Admin', 'super_admin', 'active')
		ON CONFLICT (school_id, email) 
		DO UPDATE SET 
			password_hash = $3,
			role = 'super_admin',
			status = 'active'`,
		systemSchoolID, cfg.SuperAdminEmail, hashedPassword)

	if err != nil {
		return err
	}

	logger.GetLogger().Info().Str("email", cfg.SuperAdminEmail).Msg("Super admin seeded/updated successfully")
	return nil
}
