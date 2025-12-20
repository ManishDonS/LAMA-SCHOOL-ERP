package handlers

import (
	"context"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/class/database"
	"school-erp/class/middleware"
)

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "healthy"})
}

// ListClasses handles GET /api/v1/classes
func (h *Handler) ListClasses(c *fiber.Ctx) error {
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	query := `SELECT id, school_id, name, grade, section, capacity, teacher_id, teacher_name, room, shift, academic_year, description, status, created_at, updated_at FROM classes ORDER BY grade ASC, section ASC`

	rows, err := db.Query(context.Background(), query)
	if err != nil {
		log.Printf("Error listing classes: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch classes"})
	}
	defer rows.Close()

	var classes []database.Class
	for rows.Next() {
		var cl database.Class
		var teacherID *int64
		var teacherName *string
		err := rows.Scan(
			&cl.ID, &cl.SchoolID, &cl.Name, &cl.Grade, &cl.Section, &cl.Capacity,
			&teacherID, &teacherName, &cl.Room, &cl.Shift, &cl.AcademicYear,
			&cl.Description, &cl.Status, &cl.CreatedAt, &cl.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning class row: %v", err)
			continue
		}
		if teacherID != nil {
			cl.TeacherID = *teacherID
		}
		if teacherName != nil {
			cl.TeacherName = *teacherName
		}
		classes = append(classes, cl)
	}

	if classes == nil {
		classes = []database.Class{}
	}

	return c.JSON(fiber.Map{"classes": classes})
}

// CreateClass handles POST /api/v1/classes
func (h *Handler) CreateClass(c *fiber.Ctx) error {
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	var req database.Class
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	tenantCode := middleware.GetTenantCode(c)

	query := `
		INSERT INTO classes (school_id, name, grade, section, capacity, teacher_id, teacher_name, room, shift, academic_year, description, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
		RETURNING id
	`

	err := db.QueryRow(context.Background(), query,
		tenantCode, req.Name, req.Grade, req.Section, req.Capacity,
		req.TeacherID, req.TeacherName, req.Room, req.Shift, req.AcademicYear,
		req.Description, req.Status,
	).Scan(&req.ID)

	if err != nil {
		log.Printf("Error creating class: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create class"})
	}

	return c.Status(fiber.StatusCreated).JSON(req)
}

// UpdateClass handles PUT /api/v1/classes/:id
func (h *Handler) UpdateClass(c *fiber.Ctx) error {
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	id := c.Params("id")
	var req database.Class
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		UPDATE classes SET 
			name = $1, grade = $2, section = $3, capacity = $4, 
			teacher_id = $5, teacher_name = $6, room = $7, shift = $8, 
			academic_year = $9, description = $10, status = $11, updated_at = NOW()
		WHERE id = $12
	`

	_, err := db.Exec(context.Background(), query,
		req.Name, req.Grade, req.Section, req.Capacity,
		req.TeacherID, req.TeacherName, req.Room, req.Shift,
		req.AcademicYear, req.Description, req.Status, id,
	)

	if err != nil {
		log.Printf("Error updating class: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update class"})
	}

	return c.JSON(fiber.Map{"message": "Class updated successfully"})
}

// DeleteClass handles DELETE /api/v1/classes/:id
func (h *Handler) DeleteClass(c *fiber.Ctx) error {
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	id := c.Params("id")
	query := `DELETE FROM classes WHERE id = $1`
	_, err := db.Exec(context.Background(), query, id)
	if err != nil {
		log.Printf("Error deleting class: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete class"})
	}

	return c.JSON(fiber.Map{"message": "Class deleted successfully"})
}
