package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{createWebSocketConnectionsTable}

	for _, migration := range migrations {
		if _, err := pool.Exec(context.Background(), migration); err != nil {
			log.Printf("Error running migration: %v", err)
			return err
		}
	}

	log.Println("✓ Migrations completed")
	return nil
}

const createWebSocketConnectionsTable = `
CREATE TABLE IF NOT EXISTS ws_connections (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL,
	school_id UUID NOT NULL,
	connection_id VARCHAR(255) UNIQUE,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	disconnected_at TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ws_user_id ON ws_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_ws_school_id ON ws_connections(school_id);
`
