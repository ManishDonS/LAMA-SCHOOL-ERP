package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations executes all database migrations
func RunMigrations(db *pgxpool.Pool) error {
	ctx := context.Background()

	// Create schools table
	if err := createSchoolsTable(ctx, db); err != nil {
		return fmt.Errorf("failed to create schools table: %w", err)
	}

	return nil
}

// createSchoolsTable creates the schools metadata table
func createSchoolsTable(ctx context.Context, db *pgxpool.Pool) error {
	// 1. Create Table
	createTableQuery := `
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
		status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	`

	if _, err := db.Exec(ctx, createTableQuery); err != nil {
		return fmt.Errorf("failed to create table: %w", err)
	}

	// 2. Run Schema Migration (Add missing columns to existing table)
	migrationQuery := `
	DO $$ 
	BEGIN 
		-- Add code column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='code') THEN
			ALTER TABLE schools ADD COLUMN code VARCHAR(20) NOT NULL DEFAULT '';
		END IF;

		-- Add db_name column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='db_name') THEN
			ALTER TABLE schools ADD COLUMN db_name VARCHAR(100) NOT NULL DEFAULT '';
		END IF;

		-- Add db_user column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='db_user') THEN
			ALTER TABLE schools ADD COLUMN db_user VARCHAR(100) NOT NULL DEFAULT '';
		END IF;

		-- Add db_password column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='db_password') THEN
			ALTER TABLE schools ADD COLUMN db_password TEXT NOT NULL DEFAULT '';
		END IF;

		-- Add db_host column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='db_host') THEN
			ALTER TABLE schools ADD COLUMN db_host VARCHAR(255) NOT NULL DEFAULT 'postgres';
		END IF;

		-- Add db_port column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='db_port') THEN
			ALTER TABLE schools ADD COLUMN db_port INTEGER NOT NULL DEFAULT 5432;
		END IF;

		-- Add domain column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='domain') THEN
			ALTER TABLE schools ADD COLUMN domain VARCHAR(255) NOT NULL DEFAULT '';
		END IF;

		-- Add logo_url column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='logo_url') THEN
			ALTER TABLE schools ADD COLUMN logo_url TEXT;
		END IF;

		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='timezone') THEN
			ALTER TABLE schools ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT 'UTC';
		END IF;

		-- Add module_permissions column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='module_permissions') THEN
			ALTER TABLE schools ADD COLUMN module_permissions JSONB DEFAULT '{}'::jsonb;
		END IF;

		-- Add vat_number column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='vat_number') THEN
			ALTER TABLE schools ADD COLUMN vat_number VARCHAR(100);
		END IF;

		-- Add registration_number column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='registration_number') THEN
			ALTER TABLE schools ADD COLUMN registration_number VARCHAR(100);
		END IF;

		-- Add tax_id column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='tax_id') THEN
			ALTER TABLE schools ADD COLUMN tax_id VARCHAR(100);
		END IF;

		-- Add school_type column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='school_type') THEN
			ALTER TABLE schools ADD COLUMN school_type VARCHAR(50) DEFAULT 'School';
		END IF;

		-- Add alternate_phone column
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='alternate_phone') THEN
			ALTER TABLE schools ADD COLUMN alternate_phone VARCHAR(20);
		END IF;
	END $$;
	`

	if _, err := db.Exec(ctx, migrationQuery); err != nil {
		return fmt.Errorf("failed to run schema migration: %w", err)
	}

	// 3. Create Indexes and Triggers
	createIndexesQuery := `
	-- Create indexes
	CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
	CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
	CREATE INDEX IF NOT EXISTS idx_schools_domain ON schools(domain);
	CREATE INDEX IF NOT EXISTS idx_schools_created_at ON schools(created_at);

	-- Create updated_at trigger
	CREATE OR REPLACE FUNCTION update_schools_updated_at()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = CURRENT_TIMESTAMP;
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql;

	DROP TRIGGER IF EXISTS trigger_update_schools_updated_at ON schools;
	CREATE TRIGGER trigger_update_schools_updated_at
	BEFORE UPDATE ON schools
	FOR EACH ROW
	EXECUTE FUNCTION update_schools_updated_at();
	`

	if _, err := db.Exec(ctx, createIndexesQuery); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	// 4. Create Users Table in MainDB (for Super Admin)
	if err := createMainDBUsersTable(ctx, db); err != nil {
		return fmt.Errorf("failed to create users table in main db: %w", err)
	}

	return nil

}

// createMainDBUsersTable creates users table in the main database for super admins
func createMainDBUsersTable(ctx context.Context, db *pgxpool.Pool) error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		school_id UUID,
		email VARCHAR(255) NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		first_name VARCHAR(100) NOT NULL,
		last_name VARCHAR(100) NOT NULL,
		role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'staff')),
		status VARCHAR(20) NOT NULL DEFAULT 'active',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	`

	if _, err := db.Exec(ctx, query); err != nil {
		return err
	}

	return nil
}

// RunTenantMigrations runs migrations for a tenant database
func RunTenantMigrations(ctx context.Context, db *pgxpool.Pool) error {
	// Create tables that every tenant database will have
	if err := createTenantUsersTable(ctx, db); err != nil {
		return fmt.Errorf("failed to create users table: %w", err)
	}

	if err := createTenantStudentsTable(ctx, db); err != nil {
		return fmt.Errorf("failed to create students table: %w", err)
	}

	if err := createTenantAttendanceTable(ctx, db); err != nil {
		return fmt.Errorf("failed to create attendance table: %w", err)
	}

	return nil
}

// createTenantUsersTable creates users table for tenant
func createTenantUsersTable(ctx context.Context, db *pgxpool.Pool) error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		school_id UUID,
		email VARCHAR(255) NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		first_name VARCHAR(100) NOT NULL,
		last_name VARCHAR(100) NOT NULL,
		role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
		phone VARCHAR(20),
		status VARCHAR(50) DEFAULT 'active',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
	CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
	`

	if _, err := db.Exec(ctx, query); err != nil {
		return err
	}

	return nil
}

// createTenantStudentsTable creates students table for tenant
func createTenantStudentsTable(ctx context.Context, db *pgxpool.Pool) error {
	query := `
	CREATE TABLE IF NOT EXISTS students (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID,
		roll_number VARCHAR(50),
		class VARCHAR(50),
		section VARCHAR(10),
		date_of_birth DATE,
		parent_contact VARCHAR(255),
		address TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
	CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
	CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
	`

	if _, err := db.Exec(ctx, query); err != nil {
		return err
	}

	return nil
}

// createTenantAttendanceTable creates attendance table for tenant
func createTenantAttendanceTable(ctx context.Context, db *pgxpool.Pool) error {
	query := `
	CREATE TABLE IF NOT EXISTS attendance (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		student_id UUID NOT NULL,
		date DATE NOT NULL,
		status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
		remarks TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
	CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
	CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
	`

	if _, err := db.Exec(ctx, query); err != nil {
		return err
	}

	return nil
}
