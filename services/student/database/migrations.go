package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{
		createStudentsTable,
		createEnrollmentsTable,
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

const createStudentsTable = `
CREATE TABLE IF NOT EXISTS students (
	id BIGSERIAL PRIMARY KEY,
	school_id BIGINT NOT NULL,
	user_id BIGINT NOT NULL UNIQUE,
	roll_number VARCHAR(50) UNIQUE NOT NULL,
	class VARCHAR(50),
	section VARCHAR(10),
	admission_date TIMESTAMP NOT NULL,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
`

const createEnrollmentsTable = `
CREATE TABLE IF NOT EXISTS enrollments (
	id BIGSERIAL PRIMARY KEY,
	student_id BIGINT NOT NULL,
	class_id BIGINT NOT NULL,
	school_id BIGINT NOT NULL,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
`
