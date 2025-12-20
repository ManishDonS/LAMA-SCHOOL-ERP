package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{createClassesTable, createAcademicYearsTable}

	for _, migration := range migrations {
		if _, err := pool.Exec(context.Background(), migration); err != nil {
			log.Printf("Error running migration: %v", err)
			return err
		}
	}

	log.Println("✓ Migrations completed")
	return nil
}

const createClassesTable = `
CREATE TABLE IF NOT EXISTS classes (
	id BIGSERIAL PRIMARY KEY,
	school_id VARCHAR(50) NOT NULL,
	name VARCHAR(100) NOT NULL,
	grade VARCHAR(20),
	section VARCHAR(10),
	capacity INTEGER DEFAULT 40,
	teacher_id BIGINT,
	teacher_name VARCHAR(200),
	room VARCHAR(50),
	shift VARCHAR(50),
	academic_year VARCHAR(50),
	description TEXT,
	status VARCHAR(20) DEFAULT 'Active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
`

const createAcademicYearsTable = `
CREATE TABLE IF NOT EXISTS academic_years (
	id VARCHAR(50) PRIMARY KEY,
	school_id VARCHAR(50) NOT NULL,
	name VARCHAR(100) NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	status VARCHAR(20) DEFAULT 'Active',
	description TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	is_current BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_academic_years_school_id ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_status ON academic_years(status);
`
