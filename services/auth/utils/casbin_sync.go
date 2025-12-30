package utils

import (
	"context"
	"fmt"
	"school-erp/auth/pkg/casbin"
	"school-erp/auth/pkg/logger"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SyncPermissionsToCasbin migrates existing RBAC data to Casbin policies
func SyncPermissionsToCasbin(db *pgxpool.Pool) error {
	ctx := context.Background()
	log := logger.GetLogger()

	log.Info().Msg("Syncing existing permissions to Casbin...")

	// 1. Load Role-Permission mappings
	// p, role, domain, resource, action
	rows, err := db.Query(ctx, `
		SELECT r.name, p.slug, p.module
		FROM role_permissions rp
		JOIN roles r ON rp.role_id = r.id
		JOIN permissions p ON rp.permission_id = p.id
	`)
	if err != nil {
		return fmt.Errorf("failed to fetch role permissions: %w", err)
	}
	defer rows.Close()

	// Since permissions are generally system-wide per role, we'll use "system" as the base domain
	// and potentially others if needed. For multi-tenancy, we usually assign users to roles WITHIN a domain.
	for rows.Next() {
		var roleName, permSlug, module string
		if err := rows.Scan(&roleName, &permSlug, &module); err != nil {
			return err
		}

		// Map permSlug (e.g., student.view) to Casbin obj/act
		// Current slug format seems to be "resource.action"
		parts := splitPermSlug(permSlug)
		obj := parts[0]
		act := parts[1]

		// Add policy for each system role in "system" domain
		_, err := casbin.Enforcer.AddNamedPolicy("p", roleName, "system", obj, act)
		if err != nil {
			log.Error().Err(err).Str("role", roleName).Str("perm", permSlug).Msg("Failed to add Casbin policy")
		}
	}

	// 2. Load User-Role assignments
	// g, user_id, role, domain
	userRows, err := db.Query(ctx, `
		SELECT u.id, u.school_id, r.name
		FROM user_roles ur
		JOIN users u ON ur.user_id = u.id
		JOIN roles r ON ur.role_id = r.id
	`)
	if err != nil {
		return fmt.Errorf("failed to fetch user roles: %w", err)
	}
	defer userRows.Close()

	for userRows.Next() {
		var userID, schoolID, roleName string
		if err := userRows.Scan(&userID, &schoolID, &roleName); err != nil {
			return err
		}

		// Assign user to role in their school domain
		_, err := casbin.Enforcer.AddNamedGroupingPolicy("g", userID, roleName, schoolID)
		if err != nil {
			log.Error().Err(err).Str("user", userID).Str("role", roleName).Msg("Failed to add Casbin grouping policy")
		}

		// Also assign to "system" domain if they are super_admin
		if roleName == "super_admin" {
			casbin.Enforcer.AddNamedGroupingPolicy("g", userID, roleName, "system")
		}
	}

	// Save changes back to DB
	if err := casbin.Enforcer.SavePolicy(); err != nil {
		return fmt.Errorf("failed to save Casbin policies: %w", err)
	}

	log.Info().Msg("Casbin permission sync completed")
	return nil
}

func splitPermSlug(slug string) [2]string {
	// Example: "students.view" -> ["students", "view"]
	for i := 0; i < len(slug); i++ {
		if slug[i] == '.' {
			return [2]string{slug[:i], slug[i+1:]}
		}
	}
	return [2]string{slug, "access"}
}
