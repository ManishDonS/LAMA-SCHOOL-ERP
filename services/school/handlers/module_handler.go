package handlers

import (
	"encoding/json"
	"school-erp/school/domain"

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

	// Fetch current modules
	var activeModulesJSON []byte
	query := `SELECT active_modules FROM schools WHERE id = $1`
	err := h.db.QueryRow(c.Context(), query, schoolID).Scan(&activeModulesJSON)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	var activeModules []string
	if len(activeModulesJSON) > 0 {
		if err := json.Unmarshal(activeModulesJSON, &activeModules); err != nil {
			// If JSON is invalid, assume empty
			activeModules = []string{}
		}
	}

	// Logic to add or remove
	newModules := []string{}
	exists := false
	for _, m := range activeModules {
		if m == req.ModuleID {
			exists = true
			if req.Active {
				newModules = append(newModules, m)
			}
		} else {
			newModules = append(newModules, m)
		}
	}
	if req.Active && !exists {
		newModules = append(newModules, req.ModuleID)
	}

	// Marshal back to JSON
	modulesJSON, err := json.Marshal(newModules)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process modules"})
	}

	// Update database
	updateQuery := `UPDATE schools SET active_modules = $1, updated_at = NOW() WHERE id = $2`
	_, err = h.db.Exec(c.Context(), updateQuery, modulesJSON, schoolID)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update school modules"})
	}

	return c.JSON(fiber.Map{
		"school_id":      schoolID,
		"active_modules": newModules,
	})
}
