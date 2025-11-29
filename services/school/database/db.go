package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"school-erp/school/config"
)

// InitDB initializes the main database connection
func InitDB(cfg *config.Config) (*pgxpool.Pool, error) {
	dsn := cfg.GetMainDSN()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database config: %w", err)
	}

	// Configure pool
	config.MaxConns = int32(cfg.MaxConnections)
	config.MinConns = 1
	config.MaxConnLifetime = cfg.ConnMaxLifetime
	config.ConnConfig.ConnectTimeout = 10 * time.Second

	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Test the connection
	if err := db.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}

	fmt.Println("Successfully connected to main database")
	return db, nil
}
