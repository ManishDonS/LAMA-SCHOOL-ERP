package handlers

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"school-erp/school/domain"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
)

// SetupTestDB creates a connection to the test database
// Assumes DB is running on localhost:5432
func SetupTestDB(t *testing.T) *pgxpool.Pool {
	dsn := "postgres://postgres:postgres@localhost:5432/school_erp?sslmode=disable"
	ctx := context.Background()
	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Skip("Skipping integration test: database not available")
	}
	if err := db.Ping(ctx); err != nil {
		t.Skip("Skipping integration test: database not reachable")
	}
	return db
}

func TestGetAvailableModules(t *testing.T) {
	db := SetupTestDB(t)
	defer db.Close()

	h := NewModuleHandler(db)
	app := fiber.New()
	app.Get("/modules", h.GetAvailableModules)

	req := httptest.NewRequest("GET", "/modules", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var modules []domain.Module
	json.NewDecoder(resp.Body).Decode(&modules)

	assert.NotEmpty(t, modules)
	assert.Equal(t, "students", modules[0].ID)
}

func TestToggleModule(t *testing.T) {
	db := SetupTestDB(t)
	defer db.Close()

	// Create a dummy school for testing
	// We need to insert a school first
	ctx := context.Background()
	// Using a valid UUID format for id if the DB enforces it. The migration said UUID.
	// So "test-school-uuid" might fail if it's not a UUID.
	// Let's generate a temporary UUID or rely on INSERT RETURNING.

	// Cleanup first
	db.Exec(ctx, "DELETE FROM schools WHERE code = 'TEST001'")

	var id string
	err := db.QueryRow(ctx, `
        INSERT INTO schools (name, code, db_name, db_user, db_password, db_host, domain, active_modules)
        VALUES ('Test School', 'TEST001', 'test_db', 'user', 'pass', 'host', 'test.com', '[]'::jsonb)
        RETURNING id::text
    `).Scan(&id)

	if err != nil {
		t.Fatalf("Failed to create test school: %v", err)
	}
	defer db.Exec(ctx, "DELETE FROM schools WHERE id = $1", id)

	h := NewModuleHandler(db)
	app := fiber.New()
	app.Post("/schools/:id/modules", h.ToggleModule)

	// Enable 'accounting'
	payload := `{"module_id": "accounting", "active": true}`
	req := httptest.NewRequest("POST", "/schools/"+id+"/modules", strings.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")

	resp, _ := app.Test(req)
	assert.Equal(t, 200, resp.StatusCode)

	// Verify in DB
	var activeModulesJSON []byte
	db.QueryRow(ctx, "SELECT active_modules FROM schools WHERE id = $1", id).Scan(&activeModulesJSON)
	assert.Contains(t, string(activeModulesJSON), "accounting")

	// Disable 'accounting'
	payload = `{"module_id": "accounting", "active": false}`
	req = httptest.NewRequest("POST", "/schools/"+id+"/modules", strings.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")

	resp, _ = app.Test(req)
	assert.Equal(t, 200, resp.StatusCode)

	db.QueryRow(ctx, "SELECT active_modules FROM schools WHERE id = $1", id).Scan(&activeModulesJSON)
	assert.NotContains(t, string(activeModulesJSON), "accounting")
}
