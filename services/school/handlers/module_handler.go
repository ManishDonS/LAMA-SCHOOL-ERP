package handlers

import (
	"encoding/json"
	"log"
	"school-erp/school/domain"

	"school-erp/school/pkg/messaging"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ModuleHandler struct {
	db *pgxpool.Pool
}

func NewModuleHandler(db *pgxpool.Pool) *ModuleHandler {
	return &ModuleHandler{db: db}
}

// GetAvailableModules returns the list of all system modules
func (h *ModuleHandler) GetAvailableModules(c *fiber.Ctx) error {
	return c.JSON(domain.AvailableModules)
}

// ToggleModuleRequest represents the payload for toggling a module
type ToggleModuleRequest struct {
	ModuleID string `json:"module_id"`
	Active   bool   `json:"active"`
}

// ToggleModule allows Super Admin OR School Admin to enable/disable a module for a school
func (h *ModuleHandler) ToggleModule(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	var req ToggleModuleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// 1. Authorization Check
	authRole, _ := c.Locals("role").(string)
	authSchoolID, _ := c.Locals("school_id").(string)

	log.Printf("[ToggleModule] Auth Check - Role: %s, SchoolID: %s, TargetSchool: %s, Module: %s, Active: %v", authRole, authSchoolID, schoolID, req.ModuleID, req.Active)

	if authRole != "super_admin" {
		// If not super admin, must be admin of THIS school
		if authSchoolID != schoolID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You can only manage modules for your own school",
			})
		}
	}

	// Validate Module ID
	if !domain.IsModuleValid(req.ModuleID) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid module ID"})
	}

	// 2. License Verification (Required only when enabling)
	if req.Active {
		var permissionsJSON []byte
		err := h.db.QueryRow(c.Context(), "SELECT module_permissions FROM schools WHERE id = $1", schoolID).Scan(&permissionsJSON)
		if err != nil {
			log.Printf("[ToggleModule] Failed to fetch permissions: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify module license"})
		}

		var modulePermissions map[string]map[string]bool
		if err := json.Unmarshal(permissionsJSON, &modulePermissions); err != nil {
			log.Printf("[ToggleModule] Failed to parse permissions: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify module license"})
		}

		// Check if module exists in permissions map (implies a license exists)
		if _, licensed := modulePermissions[req.ModuleID]; !licensed {
			log.Printf("[ToggleModule] License denied for module %s", req.ModuleID)
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have a Master License for this module. Please contact Super Admin.",
			})
		}
	}

	// 3. Atomic update
	var updateQuery string
	var args []interface{}

	if req.Active {
		// Append to array using jsonb_set or || operator, ensuring uniqueness with DISTINCT
		updateQuery = `
			UPDATE schools 
			SET active_modules = (
				SELECT jsonb_agg(DISTINCT elem) 
				FROM jsonb_array_elements(active_modules || jsonb_build_array($1::text)) elem
			), updated_at = NOW() 
			WHERE id = $2 
			RETURNING active_modules`
		args = []interface{}{req.ModuleID, schoolID}
	} else {
		// Remove from array using - operator
		updateQuery = `
			UPDATE schools 
			SET active_modules = active_modules - $1::text, updated_at = NOW() 
			WHERE id = $2 
			RETURNING active_modules`
		args = []interface{}{req.ModuleID, schoolID}
	}

	var updatedActiveModulesJSON []byte
	err := h.db.QueryRow(c.Context(), updateQuery, args...).Scan(&updatedActiveModulesJSON)

	if err != nil {
		if err.Error() == "no rows in result set" {
			log.Printf("[ToggleModule] School %s not found", schoolID)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "School not found",
			})
		}
		log.Printf("[ToggleModule] Database update failed: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update school modules"})
	}

	var updatedActiveModules []string
	json.Unmarshal(updatedActiveModulesJSON, &updatedActiveModules)

	// 4. Broadcast update via NATS
	if messaging.NatsConn != nil {
		event := map[string]interface{}{
			"school_id":      schoolID,
			"active_modules": updatedActiveModules,
		}
		eventJSON, _ := json.Marshal(event)
		messaging.NatsConn.Publish("school.modules.updated", eventJSON)
	}

	return c.JSON(fiber.Map{
		"school_id":      schoolID,
		"active_modules": updatedActiveModules,
	})
}
