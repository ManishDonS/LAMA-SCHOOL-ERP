package main

import (
	"database/sql"
	"log"
	"os"
	"school-erp/school/config"

	_ "github.com/jackc/pgx/v5/stdlib" // Import pgx stdlib driver for sql.Open
	"github.com/pressly/goose/v3"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Use the main database DSN
	dsn := cfg.GetMainDSN()

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Failed to open DB: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping DB: %v", err)
	}

	// Set dialect
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("Failed to set dialect: %v", err)
	}

	// Path to migration files
	// Assuming running from services/school root
	migrationDir := "database/migrations"

	// Get command from args (up, down, status)
	cmd := "up"
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}

	log.Printf("Running migration command: %s", cmd)

	if err := goose.Run(cmd, db, migrationDir); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("Migration completed successfully")
}
