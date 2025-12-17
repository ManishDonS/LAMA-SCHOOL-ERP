package utils

import (
	"context"
	"school-erp/auth/config"
	"school-erp/auth/pkg/logger"
	"school-erp/auth/pkg/tenant"

	"github.com/jackc/pgx/v5/pgxpool"
)

func SeedSuperAdmin(db *pgxpool.Pool, cfg *config.Config) error {
	if cfg.SuperAdminEmail == "" || cfg.SuperAdminPassword == "" {
		logger.GetLogger().Info().Msg("Super admin credentials not provided, skipping seeding")
		return nil
	}

	ctx := context.Background()

	// Encrypt DB password
	cipher, err := tenant.NewCipher(cfg.EncryptionKey)
	if err != nil {
		return err
	}
	// Use main DB credentials for system tenant
	encryptedDBPassword, err := cipher.Encrypt("postgres")
	if err != nil {
		return err
	}

	// Create system school if not exists (using UUID)
	systemSchoolID := "00000000-0000-0000-0000-000000000000"
	_, err = db.Exec(ctx, `
		INSERT INTO schools (id, name, code, db_name, db_user, db_password, db_host, db_port, domain, timezone, status)
		VALUES ($1, 'System', 'system', 'school_erp', 'postgres', $2, 'postgres', 5432, 'system.local', 'UTC', 'active')
		ON CONFLICT (code) DO UPDATE SET name = 'System', status = 'active', db_name = 'school_erp', db_user = 'postgres', db_password = $2`,
		systemSchoolID, encryptedDBPassword)
	if err != nil {
		return err
	}

	// Hash password
	hashedPassword, err := GeneratePasswordHash(cfg, cfg.SuperAdminPassword)
	if err != nil {
		return err
	}

	// Create or update super admin user
	var userID string
	err = db.QueryRow(ctx, `
		INSERT INTO users (school_id, email, password_hash, first_name, last_name, role, status)
		VALUES ($1, $2, $3, 'Super', 'Admin', 'super_admin', 'active')
		ON CONFLICT (school_id, email) 
		DO UPDATE SET 
			password_hash = $3,
			role = 'super_admin',
			status = 'active'
		RETURNING id`,
		systemSchoolID, cfg.SuperAdminEmail, hashedPassword).Scan(&userID)

	if err != nil {
		return err
	}

	// Assign super_admin role to user
	var roleID string
	err = db.QueryRow(ctx, "SELECT id FROM roles WHERE name = 'super_admin'").Scan(&roleID)
	if err != nil {
		return err
	}

	_, err = db.Exec(ctx, `
		INSERT INTO user_roles (user_id, role_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, role_id) DO NOTHING`,
		userID, roleID)

	if err != nil {
		return err
	}

	logger.GetLogger().Info().Str("email", cfg.SuperAdminEmail).Msg("Super admin seeded/updated successfully")
	return nil
}
