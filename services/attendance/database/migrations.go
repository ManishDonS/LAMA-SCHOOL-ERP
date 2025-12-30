package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{
		createAttendanceTable,
		alterAttendanceColumns,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(context.Background(), migration); err != nil {
			log.Printf("Error running migration: %v", err)
			return err
		}
	}

	log.Println("✓ Migrations completed")
	return nil
}

const createAttendanceTable = `
CREATE TABLE IF NOT EXISTS attendance (
	id BIGSERIAL PRIMARY KEY,
	school_id VARCHAR(255) NOT NULL,
	student_id BIGINT NOT NULL,
	class VARCHAR(50),
	date TIMESTAMP NOT NULL,
	status VARCHAR(20) DEFAULT 'present',
	remarks TEXT,
	marked_by VARCHAR(255),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
`

const alterAttendanceColumns = `
-- Alter school_id and marked_by columns to VARCHAR if they exist as BIGINT
DO $$
BEGIN
	-- Check and alter school_id column type
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'attendance' 
		AND column_name = 'school_id' 
		AND data_type = 'bigint'
	) THEN
		ALTER TABLE attendance ALTER COLUMN school_id TYPE VARCHAR(255);
	END IF;

	-- Check and alter marked_by column type
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'attendance' 
		AND column_name = 'marked_by' 
		AND data_type = 'bigint'
	) THEN
		ALTER TABLE attendance ALTER COLUMN marked_by TYPE VARCHAR(255);
	END IF;
END $$;
`
