package handlers

import (
	"context"
	"time"

	"school-erp/class/database"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AcademicYearHandler struct {
	DB *pgxpool.Pool
}

func NewAcademicYearHandler(db *pgxpool.Pool) *AcademicYearHandler {
	return &AcademicYearHandler{DB: db}
}

// CreateAcademicYear creates a new academic year
func (h *AcademicYearHandler) CreateAcademicYear(c *fiber.Ctx) error {
	var req struct {
		Name        string `json:"name"`
		StartDate   string `json:"start_date"`
		EndDate     string `json:"end_date"`
		Description string `json:"description"`
		IsCurrent   bool   `json:"is_current"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	schoolID := c.Get("X-Tenant-ID")
	if schoolID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "School ID is required"})
	}

	id := time.Now().Format("20060102150405") // Simple ID generation

	// If setting as current, unset others
	if req.IsCurrent {
		_, err := h.DB.Exec(context.Background(), `
			UPDATE academic_years SET is_current = false WHERE school_id = $1
		`, schoolID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update current status"})
		}
	}

	query := `
		INSERT INTO academic_years (id, school_id, name, start_date, end_date, description, is_current)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	var ay database.AcademicYear
	err := h.DB.QueryRow(context.Background(), query,
		id, schoolID, req.Name, req.StartDate, req.EndDate, req.Description, req.IsCurrent,
	).Scan(&ay.ID, &ay.CreatedAt, &ay.UpdatedAt)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create academic year"})
	}

	ay.SchoolID = schoolID
	ay.Name = req.Name
	ay.StartDate = req.StartDate
	ay.EndDate = req.EndDate
	ay.Description = req.Description
	ay.IsCurrent = req.IsCurrent
	ay.Status = "Active"

	return c.Status(fiber.StatusCreated).JSON(ay)
}

// GetAcademicYears returns all academic years for a school
func (h *AcademicYearHandler) GetAcademicYears(c *fiber.Ctx) error {
	schoolID := c.Get("X-Tenant-ID")
	if schoolID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "School ID is required"})
	}

	rows, err := h.DB.Query(context.Background(), `
		SELECT id, name, start_date, end_date, status, description, is_current, created_at 
		FROM academic_years 
		WHERE school_id = $1 
		ORDER BY created_at DESC
	`, schoolID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch academic years"})
	}
	defer rows.Close()

	years := []database.AcademicYear{}
	for rows.Next() {
		var ay database.AcademicYear
		if err := rows.Scan(&ay.ID, &ay.Name, &ay.StartDate, &ay.EndDate, &ay.Status, &ay.Description, &ay.IsCurrent, &ay.CreatedAt); err != nil {
			continue
		}
		years = append(years, ay)
	}

	return c.JSON(years)
}

// UpdateAcademicYear updates an existing academic year
func (h *AcademicYearHandler) UpdateAcademicYear(c *fiber.Ctx) error {
	id := c.Params("id")
	schoolID := c.Get("X-Tenant-ID")

	var req struct {
		Name        string `json:"name"`
		StartDate   string `json:"start_date"`
		EndDate     string `json:"end_date"`
		Status      string `json:"status"`
		Description string `json:"description"`
		IsCurrent   bool   `json:"is_current"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// If setting as current, unset others
	if req.IsCurrent {
		_, err := h.DB.Exec(context.Background(), `
			UPDATE academic_years SET is_current = false WHERE school_id = $1 AND id != $2
		`, schoolID, id)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update current status"})
		}
	}

	query := `
		UPDATE academic_years 
		SET name = $1, start_date = $2, end_date = $3, status = $4, description = $5, is_current = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7 AND school_id = $8
		RETURNING id
	`

	var updatedID string
	err := h.DB.QueryRow(context.Background(), query,
		req.Name, req.StartDate, req.EndDate, req.Status, req.Description, req.IsCurrent, id, schoolID,
	).Scan(&updatedID)

	if err == pgx.ErrNoRows {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Academic year not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update academic year"})
	}

	return c.JSON(fiber.Map{"message": "Academic year updated successfully"})
}

// DeleteAcademicYear deletes an academic year
func (h *AcademicYearHandler) DeleteAcademicYear(c *fiber.Ctx) error {
	id := c.Params("id")
	schoolID := c.Get("X-Tenant-ID")

	query := `DELETE FROM academic_years WHERE id = $1 AND school_id = $2 RETURNING id`

	var deletedID string
	err := h.DB.QueryRow(context.Background(), query, id, schoolID).Scan(&deletedID)

	if err == pgx.ErrNoRows {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Academic year not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete academic year"})
	}

	return c.JSON(fiber.Map{"message": "Academic year deleted successfully"})
}
