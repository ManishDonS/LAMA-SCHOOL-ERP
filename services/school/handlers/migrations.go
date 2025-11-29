package handlers

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"school-erp/school/database"
)

// RunTenantMigrations is exported for handler use
func RunTenantMigrations(ctx context.Context, db *pgxpool.Pool) error {
	return database.RunTenantMigrations(ctx, db)
}
