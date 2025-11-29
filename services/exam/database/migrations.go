package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{createExamsTable, createMarksTable}

	for _, migration := range migrations {
		if _, err := pool.Exec(context.Background(), migration); err != nil {
			log.Printf("Error running migration: %v", err)
			return err
		}
	}

	log.Println("✓ Migrations completed")
	return nil
}

const createExamsTable = `
CREATE TABLE IF NOT EXISTS exams (
	id BIGSERIAL PRIMARY KEY,
	school_id BIGINT NOT NULL,
	name VARCHAR(255) NOT NULL,
	class VARCHAR(50),
	subject VARCHAR(255),
	exam_date TIMESTAMP,
	total_marks INT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_school_id ON exams(school_id);
`

const createMarksTable = `
CREATE TABLE IF NOT EXISTS marks (
	id BIGSERIAL PRIMARY KEY,
	exam_id BIGINT NOT NULL,
	student_id BIGINT NOT NULL,
	marks INT,
	grade VARCHAR(10),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
	FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_marks_exam_id ON marks(exam_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
`
