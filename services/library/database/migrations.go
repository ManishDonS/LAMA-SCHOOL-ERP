package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{
		createBooksTable,
		createBookIssuesTable,
		createBookBookingsTable,
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

const createBooksTable = `
CREATE TABLE IF NOT EXISTS books (
	id BIGSERIAL PRIMARY KEY,
	school_id VARCHAR(50) NOT NULL,
	title VARCHAR(255) NOT NULL,
	author VARCHAR(255) NOT NULL,
	isbn VARCHAR(50),
	category VARCHAR(100),
	total_copies INTEGER DEFAULT 1,
	available_copies INTEGER DEFAULT 1,
	qr_code TEXT,
	publication_year INTEGER,
	description TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_school_id ON books(school_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
`

const createBookIssuesTable = `
CREATE TABLE IF NOT EXISTS book_issues (
	id BIGSERIAL PRIMARY KEY,
	school_id VARCHAR(50) NOT NULL,
	book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
	student_id BIGINT NOT NULL,
	issue_date DATE NOT NULL,
	due_date DATE NOT NULL,
	return_date DATE,
	status VARCHAR(20) DEFAULT 'Issued',
	fine DECIMAL(10,2) DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_issues_school_id ON book_issues(school_id);
CREATE INDEX IF NOT EXISTS idx_book_issues_student_id ON book_issues(student_id);
CREATE INDEX IF NOT EXISTS idx_book_issues_status ON book_issues(status);
`

const createBookBookingsTable = `
CREATE TABLE IF NOT EXISTS book_bookings (
	id BIGSERIAL PRIMARY KEY,
	school_id VARCHAR(50) NOT NULL,
	book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
	student_id BIGINT NOT NULL,
	booking_date DATE NOT NULL,
	priority VARCHAR(20) DEFAULT 'Medium',
	status VARCHAR(20) DEFAULT 'Pending',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_bookings_school_id ON book_bookings(school_id);
CREATE INDEX IF NOT EXISTS idx_book_bookings_student_id ON book_bookings(student_id);
`
