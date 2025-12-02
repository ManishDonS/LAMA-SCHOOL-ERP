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

	// Create default school if not exists
	var schoolID int64
	err := db.QueryRow(ctx, `
		INSERT INTO schools (name, email, phone, address, city, state, status)
		VALUES ('Default School', $1, '1234567890', 'Default Address', 'Default City', 'Default State', 'active')
		ON CONFLICT (name) DO UPDATE SET email = $1
		RETURNING id`, cfg.SuperAdminEmail).Scan(&schoolID)
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
		schoolID, cfg.SuperAdminEmail, hashedPassword)

	if err != nil {
		return err
	}

	logger.GetLogger().Info().Str("email", cfg.SuperAdminEmail).Msg("Super admin seeded/updated successfully")
	return nil
}
