package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	ctx := context.Background()

	// Initial check/fix for user-service tables
	fixSchema := `
	DO $$ 
	BEGIN 
		-- Check and fix teachers table
		IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='teachers') THEN
			IF (SELECT data_type FROM information_schema.columns WHERE table_name='teachers' AND column_name='user_id') = 'character varying' THEN
				IF (SELECT count(*) FROM teachers) = 0 THEN
					DROP TABLE teachers CASCADE;
				END IF;
			END IF;
		END IF;

		-- Check and fix parents table
		IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='parents') THEN
			IF (SELECT data_type FROM information_schema.columns WHERE table_name='parents' AND column_name='user_id') = 'character varying' THEN
				IF (SELECT count(*) FROM parents) = 0 THEN
					DROP TABLE parents CASCADE;
				END IF;
			END IF;
		END IF;

		-- Check and fix staff table
		IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='staff') THEN
			IF (SELECT data_type FROM information_schema.columns WHERE table_name='staff' AND column_name='user_id') = 'character varying' THEN
				IF (SELECT count(*) FROM staff) = 0 THEN
					DROP TABLE staff CASCADE;
				END IF;
			END IF;
		END IF;
	END $$;
	`
	if _, err := pool.Exec(ctx, fixSchema); err != nil {
		log.Printf("Error fixing user service schema: %v", err)
	}

	migrations := []string{
		createTeachersTable,
		createParentsTable,
		createStaffTable,
		createDepartmentsTable,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(context.Background(), migration); err != nil {
			log.Printf("Error running migration: %v", err)
			return err
		}
	}

	log.Println("✓ All migrations completed")
	return nil
}

const createTeachersTable = `
CREATE TABLE IF NOT EXISTS teachers (
	id BIGSERIAL PRIMARY KEY,
	school_id UUID NOT NULL,
	user_id UUID NOT NULL UNIQUE,
	qualification VARCHAR(255) NOT NULL,
	department VARCHAR(255),
	employee_id VARCHAR(50) UNIQUE NOT NULL,
	phone VARCHAR(20),
	date_of_birth DATE,
	gender VARCHAR(20),
	specialization VARCHAR(255),
	experience DECIMAL(5,2),
	employment_type VARCHAR(50),
	salary DECIMAL(12,2),
	address TEXT,
	city VARCHAR(100),
	state VARCHAR(100),
	subject VARCHAR(255),
	class_assigned VARCHAR(100),
	join_date TIMESTAMP NOT NULL,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all columns exist for existing tables
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS specialization VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS experience DECIMAL(5,2);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS class_assigned VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
`

const createParentsTable = `
CREATE TABLE IF NOT EXISTS parents (
	id BIGSERIAL PRIMARY KEY,
	school_id UUID NOT NULL,
	user_id UUID NOT NULL UNIQUE,
	guardian_id VARCHAR(50) UNIQUE,
	phone_number VARCHAR(20),
	alternate_phone VARCHAR(20),
	relationship VARCHAR(100),
	date_of_birth DATE,
	gender VARCHAR(20),
	marital_status VARCHAR(50),
	occupation VARCHAR(255),
	company VARCHAR(255),
	income DECIMAL(12,2),
	address TEXT,
	city VARCHAR(100),
	state VARCHAR(100),
	zip_code VARCHAR(20),
	communication_preference VARCHAR(50),
	emergency_contact_name VARCHAR(200),
	emergency_contact_phone VARCHAR(20),
	emergency_relationship VARCHAR(100),
	status VARCHAR(50) DEFAULT 'active',
	notes TEXT,
	linked_students JSONB DEFAULT '[]',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all columns exist for existing tables
ALTER TABLE parents ADD COLUMN IF NOT EXISTS guardian_id VARCHAR(50);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS relationship VARCHAR(100);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS income DECIMAL(12,2);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS communication_preference VARCHAR(50);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_relationship VARCHAR(100);
ALTER TABLE parents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE parents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS linked_students JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_parents_school_id ON parents(school_id);
CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_guardian_id ON parents(guardian_id);
`

const createStaffTable = `
CREATE TABLE IF NOT EXISTS staff (
	id BIGSERIAL PRIMARY KEY,
	school_id UUID NOT NULL,
	user_id UUID NOT NULL UNIQUE,
	department VARCHAR(255),
	position VARCHAR(255),
	employee_id VARCHAR(50) UNIQUE NOT NULL,
	phone VARCHAR(20),
	address TEXT,
	city VARCHAR(100),
	state VARCHAR(100),
	zip_code VARCHAR(20),
	qualification VARCHAR(255),
	experience DECIMAL(5,2),
	salary DECIMAL(12,2),
	notes TEXT,
	join_date TIMESTAMP NOT NULL,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all columns exist for existing tables
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS experience DECIMAL(5,2);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_staff_school_id ON staff(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

`

const createDepartmentsTable = `
CREATE TABLE IF NOT EXISTS departments (
	id BIGSERIAL PRIMARY KEY,
	school_id UUID NOT NULL,
	name VARCHAR(255) NOT NULL,
	code VARCHAR(50) NOT NULL,
	description TEXT,
	head_of_department VARCHAR(255),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all columns exist for existing tables
ALTER TABLE departments ADD COLUMN IF NOT EXISTS code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_departments_school_id ON departments(school_id);
`
