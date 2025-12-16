package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{
		createTeachersTable,
		createParentsTable,
		createStaffTable,
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
	school_id VARCHAR(255) NOT NULL,
	user_id VARCHAR(255) NOT NULL UNIQUE,
	qualification VARCHAR(255) NOT NULL,
	department VARCHAR(255),
	employee_id VARCHAR(50) UNIQUE NOT NULL,
	join_date TIMESTAMP NOT NULL,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
`

const createParentsTable = `
CREATE TABLE IF NOT EXISTS parents (
	id BIGSERIAL PRIMARY KEY,
	school_id VARCHAR(255) NOT NULL,
	user_id VARCHAR(255) NOT NULL UNIQUE,
	phone_number VARCHAR(20),
	occupation VARCHAR(255),
	address TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parents_school_id ON parents(school_id);
CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id);
`

const createStaffTable = `
CREATE TABLE IF NOT EXISTS staff (
	id BIGSERIAL PRIMARY KEY,
	school_id VARCHAR(255) NOT NULL,
	user_id VARCHAR(255) NOT NULL UNIQUE,
	department VARCHAR(255),
	position VARCHAR(255),
	employee_id VARCHAR(50) UNIQUE NOT NULL,
	join_date TIMESTAMP NOT NULL,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_school_id ON staff(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
`
