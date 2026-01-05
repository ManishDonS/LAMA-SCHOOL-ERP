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
				-- If table exists but ID is not UUID, and it's empty, drop it to recreate correctly.
				-- This handles cases where older versions of the service might have created the table with incorrect types.
				IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
					IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') != 'uuid' THEN
						IF (SELECT count(*) FROM users) = 0 THEN
							DROP TABLE users CASCADE;
						END IF;
					END IF;
				END IF;

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

				-- Add columns if they were missing (for legacy schemas that weren't dropped)
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
				name VARCHAR(100) NOT NULL UNIQUE,
				description TEXT,
				is_system BOOLEAN DEFAULT FALSE,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);`,
		},
		{
			name: "add_is_system_to_roles",
			sql: `
			ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
			`,
		},
		{
			name: "add_unique_constraint_roles_name",
			sql: `
			DO $$ 
			BEGIN 
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_key') THEN 
					ALTER TABLE roles ADD CONSTRAINT roles_name_key UNIQUE (name); 
				END IF; 
			END $$;
			`,
		},
		{
			name: "drop_school_id_from_roles",
			sql: `
			ALTER TABLE roles DROP COLUMN IF EXISTS school_id;
			`,
		},
		{
			name: "create_permissions_table",
			sql: `
			CREATE TABLE IF NOT EXISTS permissions (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				slug VARCHAR(100) NOT NULL UNIQUE,
				module VARCHAR(100) NOT NULL,
				description TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);`,
		},
		{
			name: "create_role_permissions_table",
			sql: `
			CREATE TABLE IF NOT EXISTS role_permissions (
				role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
				permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
				PRIMARY KEY (role_id, permission_id)
			);`,
		},
		{
			name: "create_user_roles_table",
			sql: `
			CREATE TABLE IF NOT EXISTS user_roles (
				user_id UUID REFERENCES users(id) ON DELETE CASCADE,
				role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
				PRIMARY KEY (user_id, role_id)
			);`,
		},
		{
			name: "seed_system_roles",
			sql: `
			INSERT INTO roles (name, description, is_system) VALUES
			('admin', 'School Administrator', TRUE),
			('teacher', 'Teacher', TRUE),
			('student', 'Student', TRUE),
			('parent', 'Parent', TRUE),
			('staff', 'Staff Member', TRUE)
			ON CONFLICT (name) DO NOTHING;
			`,
		},
		{
			name: "seed_permissions",
			sql: `
			INSERT INTO permissions (slug, module, description) VALUES
			-- Students
			('students.view', 'students', 'View students'),
			('students.create', 'students', 'Create students'),
			('students.update', 'students', 'Update students'),
			('students.delete', 'students', 'Delete students'),
			-- Teachers
			('teachers.view', 'teachers', 'View teachers'),
			('teachers.create', 'teachers', 'Create teachers'),
			('teachers.update', 'teachers', 'Update teachers'),
			('teachers.delete', 'teachers', 'Delete teachers'),
			-- Attendance
			('attendance.view', 'attendance', 'View attendance'),
			('attendance.create', 'attendance', 'Mark attendance'),
			('attendance.update', 'attendance', 'Update attendance'),
			('attendance.delete', 'attendance', 'Delete attendance'),
			-- Accounting
			('accounting.view', 'accounting', 'View accounting'),
			('accounting.create', 'accounting', 'Create records'),
			('accounting.update', 'accounting', 'Update records'),
			('accounting.delete', 'accounting', 'Delete records'),
			-- Library
			('library.view', 'library', 'View library'),
			('library.create', 'library', 'Add books'),
			('library.update', 'library', 'Update books'),
			('library.delete', 'library', 'Delete books'),
			-- Exams
			('exams.view', 'exams', 'View exams'),
			('exams.create', 'exams', 'Create exams'),
			('exams.update', 'exams', 'Update exams'),
			('exams.delete', 'exams', 'Delete exams'),
			-- Transport
			('transport.view', 'transport', 'View transport'),
			('transport.create', 'transport', 'Create routes'),
			('transport.update', 'transport', 'Update routes'),
			('transport.delete', 'transport', 'Delete routes'),
			-- Communication
			('communication.view', 'communication', 'View messages'),
			('communication.create', 'communication', 'Send messages'),
			-- Website
			('website.view', 'website', 'View website settings'),
			('website.update', 'website', 'Update website content'),
			-- Roles & Permissions (RBAC)
			('roles.view', 'roles', 'View roles'),
			('roles.create', 'roles', 'Create roles'),
			('roles.update', 'roles', 'Update roles'),
			('roles.delete', 'roles', 'Delete roles'),
			('permissions.view', 'permissions', 'View permissions')
			ON CONFLICT (slug) DO NOTHING;
			`,
		},
		{
			name: "seed_admin_permissions",
			sql: `
			-- Grant ALL permissions to Admin role
			INSERT INTO role_permissions (role_id, permission_id)
			SELECT r.id, p.id 
			FROM roles r CROSS JOIN permissions p
			WHERE r.name = 'admin'
			ON CONFLICT DO NOTHING;
			`,
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
		{
			name: "seed_super_admin_role_and_permissions",
			sql: `
			-- Create super_admin role if not exists
			INSERT INTO roles (name, description, is_system) 
			VALUES ('super_admin', 'Super Administrator', TRUE)
			ON CONFLICT (name) DO NOTHING;

			-- Grant ALL permissions to super_admin role
			INSERT INTO role_permissions (role_id, permission_id)
			SELECT r.id, p.id 
			FROM roles r CROSS JOIN permissions p
			WHERE r.name = 'super_admin'
			ON CONFLICT DO NOTHING;
			`,
		},
		{
			name: "alter_casbin_rule_add_id_default",
			sql: `
			DO $$
			BEGIN
				-- Check if casbin_rule table exists
				IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'casbin_rule') THEN
					-- Check if 'id' column exists in casbin_rule and if it doesn't have a default value
					IF EXISTS (
						SELECT 1
						FROM information_schema.columns
						WHERE table_name = 'casbin_rule'
						AND column_name = 'id'
						AND column_default IS NULL
					) THEN
						ALTER TABLE casbin_rule ALTER COLUMN id SET DEFAULT gen_random_uuid();
						-- Also make sure it's NOT NULL, as it's a primary key candidate.
						-- This might be redundant if it was already PRIMARY KEY, but safe to ensure.
						ALTER TABLE casbin_rule ALTER COLUMN id SET NOT NULL;
					END IF;
					-- Also ensure the primary key is set correctly to id if it's not already
					IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'casbin_rule'::regclass AND contype = 'p') THEN
						ALTER TABLE casbin_rule ADD PRIMARY KEY (id);
					END IF;
				END IF;
			END $$;
			`,
		},
		{
			name: "add_account_lockout_to_users",
			sql: `
			ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
			ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
			`,
		},
		{
			name: "migrate_refresh_tokens_to_hash",
			sql: `
			DO $$
			BEGIN
				-- Check if the column 'token' exists (old schema)
				IF EXISTS (
					SELECT 1
					FROM information_schema.columns
					WHERE table_name = 'refresh_tokens'
					AND column_name = 'token'
				) THEN
					-- Step 1: Add new token_hash column
					ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS token_hash VARCHAR(64);

					-- Step 2: Delete all existing refresh tokens (they will be invalidated)
					-- Users will need to login again to get new hashed tokens
					DELETE FROM refresh_tokens;

					-- Step 3: Drop the old token column
					ALTER TABLE refresh_tokens DROP COLUMN token;

					-- Step 4: Make token_hash NOT NULL and UNIQUE
					ALTER TABLE refresh_tokens ALTER COLUMN token_hash SET NOT NULL;
					ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash);

					-- Step 5: Create index on token_hash for fast lookups
					CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

					-- Step 6: Add comment explaining the security improvement
					COMMENT ON COLUMN refresh_tokens.token_hash IS
						'SHA-256 hash of the refresh token. Original token is never stored for security. This protects against database breaches, backup theft, and insider threats.';

					RAISE NOTICE 'Migration completed: Refresh tokens now use SHA-256 hashing. All existing sessions invalidated for security.';
				ELSE
					-- Column already migrated or doesn't exist, skip
					RAISE NOTICE 'Refresh tokens already using token_hash column. Skipping migration.';
				END IF;
			END $$;
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
