package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{createFeeStructureTable, createInvoiceTable}

	for _, migration := range migrations {
		if _, err := pool.Exec(context.Background(), migration); err != nil {
			log.Printf("Error running migration: %v", err)
			return err
		}
	}

	log.Println("✓ Migrations completed")
	return nil
}

const createFeeStructureTable = `
CREATE TABLE IF NOT EXISTS fee_structures (
	id BIGSERIAL PRIMARY KEY,
	school_id BIGINT NOT NULL,
	class VARCHAR(50),
	amount DECIMAL(10,2) NOT NULL,
	description TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

const createInvoiceTable = `
CREATE TABLE IF NOT EXISTS invoices (
	id BIGSERIAL PRIMARY KEY,
	school_id BIGINT NOT NULL,
	student_id BIGINT NOT NULL,
	amount DECIMAL(10,2) NOT NULL,
	due_date TIMESTAMP,
	status VARCHAR(50) DEFAULT 'pending',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
`
