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

// ToggleModule allows Super Admin to enable/disable a module for a school
func (h *ModuleHandler) ToggleModule(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	var req ToggleModuleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Validate Module ID
	if !domain.IsModuleValid(req.ModuleID) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid module ID"})
	}

	// Atomic update with license check
	// 1. If active=true, append module_id if not exists AND module is licensed
	// 2. If active=false, remove module_id

	var updateQuery string
	var args []interface{}

	if req.Active {
		// Append to array using jsonb_set or || operator, ensuring uniqueness with DISTINCT
		// and verifying license in the WHERE clause
		updateQuery = `
			UPDATE schools 
			SET active_modules = (
				SELECT jsonb_agg(DISTINCT elem) 
				FROM jsonb_array_elements(active_modules || jsonb_build_array($1::text)) elem
			), updated_at = NOW() 
			WHERE id = $2 
			AND (
				EXISTS (
					SELECT 1 FROM jsonb_each_text(module_permissions->$1) WHERE value = 'true'
				)
			)
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
			log.Printf("Authorization failure for school %s, module %s: Module cannot be activated due to missing license or school not found.", schoolID, req.ModuleID)
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":  "Module cannot be activated. Either school doesn't exist or it lacks a Master License for this module.",
				"module": req.ModuleID,
			})
		}
		log.Printf("Failed to update school modules: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update school modules"})
	}

	var updatedActiveModules []string
	json.Unmarshal(updatedActiveModulesJSON, &updatedActiveModules)

	// 3. Broadcast update via NATS
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
