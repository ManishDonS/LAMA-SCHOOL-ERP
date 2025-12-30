package casbin

import (
	_ "embed"
	"fmt"
	"school-erp/attendance/pkg/logger"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	"github.com/jackc/pgx/v5/pgxpool"
	pgxadapter "github.com/pckhoi/casbin-pgx-adapter/v3"
)

//go:embed model.conf
var modelConfig string

var Enforcer *casbin.Enforcer

// InitEnforcer initializes the Casbin enforcer with a PostgreSQL adapter
func InitEnforcer(db *pgxpool.Pool) error {
	// Initialize the adapter with the existing pgx connection pool
	adapter, err := pgxadapter.NewAdapter("", pgxadapter.WithConnectionPool(db))
	if err != nil {
		return fmt.Errorf("failed to create casbin adapter: %w", err)
	}

	// Load model from embedded string
	m, err := model.NewModelFromString(modelConfig)
	if err != nil {
		return fmt.Errorf("failed to create casbin model: %w", err)
	}

	// Create the enforcer
	e, err := casbin.NewEnforcer(m, adapter)
	if err != nil {
		return fmt.Errorf("failed to create casbin enforcer: %w", err)
	}

	// Load the policy from DB
	err = e.LoadPolicy()
	if err != nil {
		return fmt.Errorf("failed to load casbin policy: %w", err)
	}

	// Seed default policies for attendance resource
	if err := SeedDefaultPolicies(e); err != nil {
		return fmt.Errorf("failed to seed default policies: %w", err)
	}

	// Log loaded policies for debugging
	log := logger.GetLogger()
	allPolicies, _ := e.GetPolicy()
	allGroupingPolicies, _ := e.GetGroupingPolicy()
	log.Debug().
		Int("policy_count", len(allPolicies)).
		Int("grouping_policy_count", len(allGroupingPolicies)).
		Interface("policies", allPolicies).
		Interface("grouping_policies", allGroupingPolicies).
		Msg("Casbin policies loaded and seeded")

	Enforcer = e
	return nil
}

// SeedDefaultPolicies seeds the casbin_rule table with default permissions for attendance
func SeedDefaultPolicies(e *casbin.Enforcer) error {
	// Format: sub, dom, obj, act
	policies := [][]string{
		{"admin", "system", "attendance", "view"},
		{"admin", "system", "attendance", "create"},
		{"admin", "system", "attendance", "update"},
		{"admin", "system", "attendance", "delete"},
		{"admin", "cbcd6687-569d-426b-a1f9-a6b7cef689c0", "attendance", "view"},
		{"admin", "cbcd6687-569d-426b-a1f9-a6b7cef689c0", "attendance", "create"},
		{"admin", "cbcd6687-569d-426b-a1f9-a6b7cef689c0", "attendance", "update"},
		{"admin", "cbcd6687-569d-426b-a1f9-a6b7cef689c0", "attendance", "delete"},
		{"teacher", "system", "attendance", "view"},
		{"teacher", "system", "attendance", "create"},
		{"teacher", "system", "attendance", "update"},
		{"staff", "system", "attendance", "view"},
	}

	for _, p := range policies {
		// AddPolicy will not add duplicate policies if already exists
		_, err := e.AddPolicy(p[0], p[1], p[2], p[3])
		if err != nil {
			return fmt.Errorf("failed to add policy %v: %w", p, err)
		}
	}

	// Explicitly save policy to adapter (DB)
	return e.SavePolicy()
}
