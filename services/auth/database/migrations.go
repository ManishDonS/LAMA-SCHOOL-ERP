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
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				name VARCHAR(255) NOT NULL,
				code VARCHAR(20) NOT NULL UNIQUE,
				db_name VARCHAR(100) NOT NULL UNIQUE,
				db_user VARCHAR(100) NOT NULL,
				db_password TEXT NOT NULL,
				db_host VARCHAR(255) NOT NULL DEFAULT 'postgres',
				db_port INTEGER NOT NULL DEFAULT 5432,
				domain VARCHAR(255) NOT NULL UNIQUE,
				email VARCHAR(255),
				phone VARCHAR(20),
				address TEXT,
				city VARCHAR(100),
				state VARCHAR(100),
				country VARCHAR(100),
				pincode VARCHAR(10),
				website VARCHAR(255),
				logo_url TEXT,
				timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
				active_modules JSONB DEFAULT '[]'::jsonb,
				module_permissions JSONB DEFAULT '{}'::jsonb,
				status VARCHAR(50) DEFAULT 'active',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);`,
		},
		{
			name: "create_users_table",
			sql: `
			DO $$ 
			BEGIN 
				CREATE TABLE IF NOT EXISTS users (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					school_id UUID,
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

				-- Add permissions for existing tables
				IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND table_schema='public' AND column_name='school_id') THEN
					ALTER TABLE users ADD COLUMN school_id UUID;
				END IF;

				IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND table_schema='public' AND column_name='password_hash') THEN
					ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
					-- Attempt to migrate data if 'password' column exists
					IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND table_schema='public' AND column_name='password') THEN
						UPDATE users SET password_hash = password WHERE password_hash IS NULL;
					END IF;
				END IF;

				IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND table_schema='public' AND column_name='status') THEN
					ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';
					
					-- Migrate is_active to status if it exists
					IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND table_schema='public' AND column_name='is_active') THEN
						UPDATE users SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END;
					END IF;
				END IF;
			END $$;
			`,
		},
		{
			name: "create_users_indexes",
			sql: `
			CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
			CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
			`,
		},
		{
			name: "create_roles_table",
			sql: `
			CREATE TABLE IF NOT EXISTS roles (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				school_id UUID NOT NULL,
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
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
