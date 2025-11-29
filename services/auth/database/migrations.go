package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(db *pgxpool.Pool) error {
	migrations := []struct {
		name string
		sql  string
	}{
		{
			name: "create_schools_table",
			sql: `
			CREATE TABLE IF NOT EXISTS schools (
				id BIGSERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL UNIQUE,
				email VARCHAR(255),
				phone VARCHAR(20),
				address TEXT,
				city VARCHAR(100),
				state VARCHAR(100),
				country VARCHAR(100),
				pincode VARCHAR(10),
				website VARCHAR(255),
				status VARCHAR(50) DEFAULT 'active',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);`,
		},
		{
			name: "create_users_table",
			sql: `
			CREATE TABLE IF NOT EXISTS users (
				id BIGSERIAL PRIMARY KEY,
				school_id BIGINT NOT NULL REFERENCES schools(id),
				email VARCHAR(255) NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				first_name VARCHAR(100),
				last_name VARCHAR(100),
				role VARCHAR(50) NOT NULL DEFAULT 'student',
				status VARCHAR(50) DEFAULT 'active',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(school_id, email)
			);
			CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
			CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
			`,
		},
		{
			name: "create_roles_table",
			sql: `
			CREATE TABLE IF NOT EXISTS roles (
				id BIGSERIAL PRIMARY KEY,
				school_id BIGINT NOT NULL REFERENCES schools(id),
				name VARCHAR(100) NOT NULL,
				description TEXT,
				permissions JSONB DEFAULT '[]',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(school_id, name)
			);`,
		},
		{
			name: "create_refresh_tokens_table",
			sql: `
			CREATE TABLE IF NOT EXISTS refresh_tokens (
				id BIGSERIAL PRIMARY KEY,
				user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				token VARCHAR(500) NOT NULL UNIQUE,
				expires_at TIMESTAMP NOT NULL,
				revoked_at TIMESTAMP,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
			CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
			`,
		},
		{
			name: "create_audit_logs_table",
			sql: `
			CREATE TABLE IF NOT EXISTS audit_logs (
				id BIGSERIAL PRIMARY KEY,
				user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
				action VARCHAR(100) NOT NULL,
				resource VARCHAR(100),
				details JSONB,
				ip_address VARCHAR(45),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
			CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
			`,
		},
	}

	for _, migration := range migrations {
		if _, err := db.Exec(context.Background(), migration.sql); err != nil {
			return fmt.Errorf("migration '%s' failed: %w", migration.name, err)
		}
		fmt.Printf("✓ Migration '%s' completed\n", migration.name)
	}

	return nil
}
