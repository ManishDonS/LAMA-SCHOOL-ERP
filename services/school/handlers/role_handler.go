package handlers

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/school/pkg/tenant"
)

// RoleHandler handles role and permission management
type RoleHandler struct {
	db            *pgxpool.Pool
	tenantManager *tenant.TenantManager
	validator     *validator.Validate
}

// NewRoleHandler creates a new role handler
func NewRoleHandler(db *pgxpool.Pool, tm *tenant.TenantManager) *RoleHandler {
	return &RoleHandler{
		db:            db,
		tenantManager: tm,
		validator:     validator.New(),
	}
}

// Helper to get tenant DB connection
func (h *RoleHandler) getTenantDB(ctx context.Context, schoolID string) (*pgxpool.Pool, error) {
	// 1. Get School Details
	var school School
	query := `SELECT code, db_name, db_user, db_password, db_host, db_port FROM schools WHERE id = $1`
	if err := h.db.QueryRow(ctx, query, schoolID).Scan(
		&school.Code,
		&school.DBName,
		&school.DBUser,
		&school.DBPassword,
		&school.DBHost,
		&school.DBPort,
	); err != nil {
		return nil, fmt.Errorf("school not found: %w", err)
	}

	// Ensure defaults
	if school.DBHost == "" {
		school.DBHost = "postgres"
	}
	if school.DBPort == 0 {
		school.DBPort = 5432
	}

	// 2. Connect
	return h.tenantManager.GetConnection(ctx, school.Code, school.DBHost, school.DBPort, school.DBName, school.DBUser, school.DBPassword)
}

// ListRoles GET /api/v1/schools/:id/roles
func (h *RoleHandler) ListRoles(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	ctx := context.Background()

	tenantDB, err := h.getTenantDB(ctx, schoolID)
	if err != nil {
		log.Printf("ListRoles: %v", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	query := `
		SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
		       COALESCE(array_agg(p.slug) FILTER (WHERE p.slug IS NOT NULL), '{}') as permissions
		FROM roles r
		LEFT JOIN role_permissions rp ON r.id = rp.role_id
		LEFT JOIN permissions p ON rp.permission_id = p.id
		GROUP BY r.id
		ORDER BY r.created_at ASC
	`

	rows, err := tenantDB.Query(ctx, query)
	if err != nil {
		log.Printf("ListRoles query error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch roles"})
	}
	defer rows.Close()

	var roles []Role
	for rows.Next() {
		var role Role
		if err := rows.Scan(
			&role.ID, &role.Name, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt, &role.Permissions,
		); err != nil {
			log.Printf("ListRoles scan error: %v", err)
			continue
		}
		roles = append(roles, role)
	}

	return c.JSON(roles)
}

// GetRole GET /api/v1/schools/:id/roles/:roleId
func (h *RoleHandler) GetRole(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	roleID := c.Params("roleId")
	ctx := context.Background()

	tenantDB, err := h.getTenantDB(ctx, schoolID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	query := `
		SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
		       COALESCE(array_agg(p.slug) FILTER (WHERE p.slug IS NOT NULL), '{}') as permissions
		FROM roles r
		LEFT JOIN role_permissions rp ON r.id = rp.role_id
		LEFT JOIN permissions p ON rp.permission_id = p.id
		WHERE r.id = $1
		GROUP BY r.id
	`

	var role Role
	if err := tenantDB.QueryRow(ctx, query, roleID).Scan(
		&role.ID, &role.Name, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt, &role.Permissions,
	); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Role not found"})
	}

	return c.JSON(role)
}

// CreateRole POST /api/v1/schools/:id/roles
type CreateRoleRequest struct {
	Name        string   `json:"name" validate:"required,min=2,max=100"`
	Description string   `json:"description" validate:"omitempty,max=500"`
	Permissions []string `json:"permissions" validate:"omitempty"` // List of slugs
}

func (h *RoleHandler) CreateRole(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	var req CreateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	ctx := context.Background()
	tenantDB, err := h.getTenantDB(ctx, schoolID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	tx, err := tenantDB.Begin(ctx)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Transaction start failed"})
	}
	defer tx.Rollback(ctx)

	// Insert Role
	var roleID string
	err = tx.QueryRow(ctx, `
		INSERT INTO roles (name, description, is_system)
		VALUES ($1, $2, FALSE)
		RETURNING id
	`, req.Name, req.Description).Scan(&roleID)

	if err != nil {
		log.Printf("CreateRole insert error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create role"})
	}

	// Insert Permissions
	if len(req.Permissions) > 0 {
		// Get IDs for slugs
		rows, err := tx.Query(ctx, "SELECT id, slug FROM permissions WHERE slug = ANY($1)", req.Permissions)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to resolve permissions"})
		}
		var permIDs []string
		for rows.Next() {
			var pid, slug string
			if err := rows.Scan(&pid, &slug); err == nil {
				permIDs = append(permIDs, pid)
			}
		}
		rows.Close()

		for _, pid := range permIDs {
			if _, err := tx.Exec(ctx, "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", roleID, pid); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to assign permissions"})
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Transaction commit failed"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Role created successfully",
		"id":      roleID,
	})
}

// UpdateRole PUT /api/v1/schools/:id/roles/:roleId
type UpdateRoleRequest struct {
	Name        string   `json:"name" validate:"required,min=2,max=100"`
	Description string   `json:"description" validate:"omitempty,max=500"`
	Permissions []string `json:"permissions" validate:"omitempty"`
}

func (h *RoleHandler) UpdateRole(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	roleID := c.Params("roleId")
	var req UpdateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()
	tenantDB, err := h.getTenantDB(ctx, schoolID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	// Check if role is system
	// Check if role is system and get current name
	var isSystem bool
	var currentName string
	if err := tenantDB.QueryRow(ctx, "SELECT is_system, name FROM roles WHERE id = $1", roleID).Scan(&isSystem, &currentName); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Role not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}

	if isSystem {
		// Prevent renaming system roles
		if req.Name != currentName {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Cannot rename system roles"})
		}
		// Allow updating description and permissions
	}

	tx, err := tenantDB.Begin(ctx)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Transaction start failed"})
	}
	defer tx.Rollback(ctx)

	// Update Role
	_, err = tx.Exec(ctx, `
		UPDATE roles SET name = $1, description = $2, updated_at = NOW()
		WHERE id = $3
	`, req.Name, req.Description, roleID)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update role"})
	}

	// Update Permissions - Delete all and re-insert
	_, err = tx.Exec(ctx, "DELETE FROM role_permissions WHERE role_id = $1", roleID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to clear permissions"})
	}

	if len(req.Permissions) > 0 {
		rows, err := tx.Query(ctx, "SELECT id FROM permissions WHERE slug = ANY($1)", req.Permissions)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to resolve permissions"})
		}
		var permIDs []string
		for rows.Next() {
			var pid string
			if err := rows.Scan(&pid); err == nil {
				permIDs = append(permIDs, pid)
			}
		}
		rows.Close()

		for _, pid := range permIDs {
			if _, err := tx.Exec(ctx, "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", roleID, pid); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to assign permissions"})
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Transaction commit failed"})
	}

	return c.JSON(fiber.Map{"message": "Role updated successfully"})
}

// DeleteRole DELETE /api/v1/schools/:id/roles/:roleId
func (h *RoleHandler) DeleteRole(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	roleID := c.Params("roleId")

	ctx := context.Background()
	tenantDB, err := h.getTenantDB(ctx, schoolID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	// Check if role is system
	var isSystem bool
	if err := tenantDB.QueryRow(ctx, "SELECT is_system FROM roles WHERE id = $1", roleID).Scan(&isSystem); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Role not found"})
	}

	if isSystem {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Cannot delete system roles"})
	}

	// Delete
	if _, err := tenantDB.Exec(ctx, "DELETE FROM roles WHERE id = $1", roleID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete role"})
	}

	return c.JSON(fiber.Map{"message": "Role deleted successfully"})
}

// ListPermissions GET /api/v1/schools/:id/permissions
func (h *RoleHandler) ListPermissions(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	ctx := context.Background()

	tenantDB, err := h.getTenantDB(ctx, schoolID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	rows, err := tenantDB.Query(ctx, "SELECT id, slug, module, description, created_at FROM permissions ORDER BY module, slug")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch permissions"})
	}
	defer rows.Close()

	var permissions []Permission
	for rows.Next() {
		var p Permission
		if err := rows.Scan(&p.ID, &p.Slug, &p.Module, &p.Description, &p.CreatedAt); err != nil {
			continue
		}
		permissions = append(permissions, p)
	}

	return c.JSON(permissions)
}
