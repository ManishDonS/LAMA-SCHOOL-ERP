package casbin

import (
	_ "embed"
	"fmt"

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
	// We pass an empty string as the first argument because we are providing the pool via an option
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

	Enforcer = e
	return nil
}

// GetUserPermissions returns all permissions for a user in a given domain as string slugs
func GetUserPermissions(userID string, domain string) []string {
	if Enforcer == nil {
		return nil
	}

	// Get implicit permissions (includes those from roles)
	// GetImplicitPermissionsForUser returns [][]string where each is [sub, dom, obj, act]
	perms, err := Enforcer.GetImplicitPermissionsForUser(userID, domain)
	if err != nil {
		return nil
	}

	var slugs []string
	for _, p := range perms {
		if len(p) >= 4 {
			obj := p[2]
			act := p[3]
			slugs = append(slugs, fmt.Sprintf("%s.%s", obj, act))
		}
	}

	return slugs
}
