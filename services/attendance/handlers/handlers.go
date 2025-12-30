package handlers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/attendance/database"
	"school-erp/attendance/middleware"
	"school-erp/attendance/pkg/logger"
	"school-erp/attendance/pkg/validation"
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

// getSchoolID retrieves the school_id from context
func (h *Handler) getSchoolID(c *fiber.Ctx) (string, error) {
	schoolIDStr, ok := c.Locals("school_id").(string)
	if !ok || schoolIDStr == "" {
		return "", fmt.Errorf("school_id not found in context")
	}

	return schoolIDStr, nil
}

// ListAttendance handles GET /api/v1/attendance
func (h *Handler) ListAttendance(c *fiber.Ctx) error {
	log := logger.GetLogger()
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	schoolID, err := h.getSchoolID(c)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get school_id from claims")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid authentication claims"})
	}

	class := c.Query("class")
	date := c.Query("date")
	status := c.Query("status")
	studentID := c.Query("student_id")

	var queryBuilder strings.Builder
	queryBuilder.WriteString("SELECT id, school_id, student_id, class, date, status, remarks, marked_by, created_at, updated_at FROM attendance WHERE school_id = $1")

	args := []interface{}{schoolID}
	argIdx := 2

	if studentID != "" {
		fmt.Fprintf(&queryBuilder, " AND student_id = $%d", argIdx)
		args = append(args, studentID)
		argIdx++
	}
	if class != "" {
		fmt.Fprintf(&queryBuilder, " AND class = $%d", argIdx)
		args = append(args, class)
		argIdx++
	}
	if date != "" {
		// Assuming date is in YYYY-MM-DD format
		fmt.Fprintf(&queryBuilder, " AND date::date = $%d", argIdx)
		args = append(args, date)
		argIdx++
	}
	if status != "" {
		fmt.Fprintf(&queryBuilder, " AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	queryBuilder.WriteString(" ORDER BY date DESC, created_at DESC")
	query := queryBuilder.String()

	rows, err := db.Query(context.Background(), query, args...)
	if err != nil {
		log.Error().Err(err).Str("query", query).Msg("Error listing attendance")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch attendance records"})
	}
	defer rows.Close()

	records := []database.Attendance{}
	for rows.Next() {
		var r database.Attendance
		var markedBy *string
		err := rows.Scan(&r.ID, &r.SchoolID, &r.StudentID, &r.Class, &r.Date, &r.Status, &r.Remarks, &markedBy, &r.CreatedAt, &r.UpdatedAt)
		if err != nil {
			log.Error().Err(err).Msg("Error scanning attendance row")
			continue
		}
		if markedBy != nil {
			r.MarkedBy = *markedBy
		}
		records = append(records, r)
	}

	return c.JSON(fiber.Map{"records": records, "count": len(records)})
}

// MarkAttendance handles POST /api/v1/attendance
func (h *Handler) MarkAttendance(c *fiber.Ctx) error {
	log := logger.GetLogger()
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	schoolID, err := h.getSchoolID(c)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get school_id from claims")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid authentication claims"})
	}

	userID, _ := c.Locals("user_id").(string)

	var req validation.MarkAttendanceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := validation.Validate(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var attendanceDate time.Time
	if req.Date == "" {
		attendanceDate = time.Now()
	} else {
		attendanceDate, err = time.Parse("2006-01-02", req.Date)
		if err != nil {
			attendanceDate, err = time.Parse(time.RFC3339, req.Date)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format, use YYYY-MM-DD or RFC3339"})
			}
		}
	}

	query := `
		INSERT INTO attendance (school_id, student_id, class, date, status, remarks, marked_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at`

	var id int64
	var createdAt, updatedAt time.Time
	err = db.QueryRow(context.Background(), query, schoolID, req.StudentID, req.Class, attendanceDate, req.Status, req.Remarks, userID).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		log.Error().Err(err).Str("school_id", schoolID).Msg("Error marking attendance")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save attendance record"})
	}

	log.Info().Int64("id", id).Str("school_id", schoolID).Msg("Attendance record marked successfully")

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":         id,
		"status":     req.Status,
		"created_at": createdAt,
		"updated_at": updatedAt,
	})
}

// UpdateAttendance handles PUT /api/v1/attendance/:id
func (h *Handler) UpdateAttendance(c *fiber.Ctx) error {
	log := logger.GetLogger()
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	schoolID, err := h.getSchoolID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid authentication claims"})
	}

	id := c.Params("id")
	var req validation.UpdateAttendanceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := validation.Validate(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var attendanceDate time.Time
	if req.Date != "" {
		attendanceDate, err = time.Parse("2006-01-02", req.Date)
		if err != nil {
			attendanceDate, err = time.Parse(time.RFC3339, req.Date)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
			}
		}
	}

	var queryBuilder strings.Builder
	queryBuilder.WriteString("UPDATE attendance SET updated_at = CURRENT_TIMESTAMP")

	args := []interface{}{}
	argIdx := 1

	if req.Status != "" {
		fmt.Fprintf(&queryBuilder, ", status = $%d", argIdx)
		args = append(args, req.Status)
		argIdx++
	}

	if req.Remarks != "" {
		fmt.Fprintf(&queryBuilder, ", remarks = $%d", argIdx)
		args = append(args, req.Remarks)
		argIdx++
	}

	if !attendanceDate.IsZero() {
		fmt.Fprintf(&queryBuilder, ", date = $%d", argIdx)
		args = append(args, attendanceDate)
		argIdx++
	}

	fmt.Fprintf(&queryBuilder, " WHERE id = $%d AND school_id = $%d RETURNING id, updated_at", argIdx, argIdx+1)
	args = append(args, id, schoolID)

	query := queryBuilder.String()

	var updatedID int64
	var updatedAt time.Time
	err = db.QueryRow(context.Background(), query, args...).Scan(&updatedID, &updatedAt)
	if err != nil {
		log.Error().Err(err).Str("id", id).Str("school_id", schoolID).Msg("Error updating attendance")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update attendance record or record not found"})
	}

	return c.JSON(fiber.Map{
		"id":         updatedID,
		"updated_at": updatedAt,
	})
}

// DeleteAttendance handles DELETE /api/v1/attendance/:id
func (h *Handler) DeleteAttendance(c *fiber.Ctx) error {
	log := logger.GetLogger()
	db := middleware.GetTenantDB(c)
	if db == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized tenant context"})
	}

	schoolID, err := h.getSchoolID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid authentication claims"})
	}

	id := c.Params("id")
	query := `DELETE FROM attendance WHERE id = $1 AND school_id = $2`
	res, err := db.Exec(context.Background(), query, id, schoolID)
	if err != nil {
		log.Error().Err(err).Str("id", id).Str("school_id", schoolID).Msg("Error deleting attendance")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete attendance record"})
	}

	if res.RowsAffected() == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Attendance record not found"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
