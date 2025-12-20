package handlers

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/attendance/database"
	"school-erp/attendance/middleware"
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

// ListAttendance handles GET /api/v1/attendance
func (h *Handler) ListAttendance(c *fiber.Ctx) error {
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	class := c.Query("class")
	date := c.Query("date")
	status := c.Query("status")

	query := `SELECT id, school_id, student_id, class, date, status, remarks, marked_by, created_at, updated_at FROM attendance WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if class != "" {
		query += fmt.Sprintf(" AND class = $%d", argIdx)
		args = append(args, class)
		argIdx++
	}
	if date != "" {
		// Assuming date is in YYYY-MM-DD format
		query += fmt.Sprintf(" AND date::date = $%d", argIdx)
		args = append(args, date)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += ` ORDER BY date DESC, created_at DESC`

	rows, err := db.Query(context.Background(), query, args...)
	if err != nil {
		log.Printf("Error listing attendance: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch attendance records"})
	}
	defer rows.Close()

	records := []database.Attendance{}
	for rows.Next() {
		var r database.Attendance
		var markedBy *int64
		err := rows.Scan(&r.ID, &r.SchoolID, &r.StudentID, &r.Class, &r.Date, &r.Status, &r.Remarks, &markedBy, &r.CreatedAt, &r.UpdatedAt)
		if err != nil {
			log.Printf("Error scanning attendance row: %v", err)
			continue
		}
		if markedBy != nil {
			r.MarkedBy = *markedBy
		}
		records = append(records, r)
	}

	return c.JSON(fiber.Map{"records": records})
}

// MarkAttendance handles POST /api/v1/attendance
func (h *Handler) MarkAttendance(c *fiber.Ctx) error {
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	var req struct {
		StudentID int64     `json:"student_id"`
		Class     string    `json:"class"`
		Date      time.Time `json:"date"`
		Status    string    `json:"status"`
		Remarks   string    `json:"remarks"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.StudentID == 0 || req.Status == "" || req.Class == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required fields"})
	}

	if req.Date.IsZero() {
		req.Date = time.Now()
	}

	schoolID := int64(0) // Should ideally be context-driven

	query := `
		INSERT INTO attendance (school_id, student_id, class, date, status, remarks)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`

	var id int64
	var createdAt, updatedAt time.Time
	err := db.QueryRow(context.Background(), query, schoolID, req.StudentID, req.Class, req.Date, req.Status, req.Remarks).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		log.Printf("Error marking attendance: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save attendance record"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":         id,
		"status":     req.Status,
		"created_at": createdAt,
		"updated_at": updatedAt,
	})
}

// UpdateAttendance handles PUT /api/v1/attendance/:id
func (h *Handler) UpdateAttendance(c *fiber.Ctx) error {
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	id := c.Params("id")
	var req struct {
		Status  string `json:"status"`
		Remarks string `json:"remarks"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	query := `
		UPDATE attendance 
		SET status = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
		RETURNING id, updated_at`

	var updatedID int64
	var updatedAt time.Time
	err := db.QueryRow(context.Background(), query, req.Status, req.Remarks, id).Scan(&updatedID, &updatedAt)
	if err != nil {
		log.Printf("Error updating attendance: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update attendance record"})
	}

	return c.JSON(fiber.Map{
		"id":         updatedID,
		"updated_at": updatedAt,
	})
}

// DeleteAttendance handles DELETE /api/v1/attendance/:id
func (h *Handler) DeleteAttendance(c *fiber.Ctx) error {
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	id := c.Params("id")
	query := `DELETE FROM attendance WHERE id = $1`
	_, err := db.Exec(context.Background(), query, id)
	if err != nil {
		log.Printf("Error deleting attendance: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete attendance record"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
