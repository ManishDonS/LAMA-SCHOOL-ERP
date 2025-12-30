package handlers

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/student/config"
	"school-erp/student/database"
	"school-erp/student/middleware"
	"school-erp/student/pkg/tenant"
	"school-erp/student/service"

	"github.com/go-playground/validator/v10"
)

type StudentHandler struct {
	db        *pgxpool.Pool
	cfg       *config.Config
	tm        *tenant.TenantManager
	validator *validator.Validate
	service   *service.StudentService
}

type CreateStudentRequest struct {
	FirstName   string `json:"first_name" validate:"required"`
	LastName    string `json:"last_name" validate:"required"`
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=8"`
	DateOfBirth string `json:"date_of_birth" validate:"omitempty,datetime=2006-01-02"`
	ClassID     string `json:"class_id" validate:"required"`
	SchoolID    string `json:"school_id" validate:"required"`
}

type UpdateStudentRequest struct {
	FirstName      string `json:"first_name" validate:"omitempty"`
	LastName       string `json:"last_name" validate:"omitempty"`
	Email          string `json:"email" validate:"omitempty,email"`
	DateOfBirth    string `json:"date_of_birth" validate:"omitempty,datetime=2006-01-02"`
	Gender         string `json:"gender" validate:"omitempty"`
	Nationality    string `json:"nationality" validate:"omitempty"`
	Class          string `json:"class" validate:"omitempty"`
	Section        string `json:"section" validate:"omitempty"`
	RollNumber     string `json:"roll_number" validate:"omitempty"`
	BloodGroup     string `json:"blood_group" validate:"omitempty"`
	Phone          string `json:"phone" validate:"omitempty"`
	Address        string `json:"address" validate:"omitempty"`
	PhotoURL       string `json:"photo_url" validate:"omitempty,url"`
	Status         string `json:"status" validate:"omitempty"`
	EnrollmentDate string `json:"enrollment_date" validate:"omitempty,datetime=2006-01-02"`
	AdmissionDate  string `json:"admission_date" validate:"omitempty,datetime=2006-01-02"`
	Notes          string `json:"notes" validate:"omitempty"`
}

type EnrollmentRequest struct {
	StudentID    string `json:"student_id"`
	ClassID      string `json:"class_id"`
	AcademicYear string `json:"academic_year"`
}

func NewStudentHandler(db *pgxpool.Pool, cfg *config.Config, tm *tenant.TenantManager, svc *service.StudentService) *StudentHandler {
	return &StudentHandler{
		db:        db,
		cfg:       cfg,
		tm:        tm,
		validator: validator.New(),
		service:   svc,
	}
}

// ListStudents godoc
// @Summary List all students
// @Description Get a list of all registered students
// @Tags students
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /students [get]
func (h *StudentHandler) ListStudents(c *fiber.Ctx) error {
	// 1. Pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	tenantDB, tenantCode := h.getTenantDB(c)
	log.Printf("[Student-Service] ListStudents: tenantCode=%s, page=%d, limit=%d", tenantCode, page, pageSize)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	students, err := h.service.ListStudents(c.Context(), tenantDB, pageSize, offset)
	if err != nil {
		log.Printf("[Student-Service] Failed to query students: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch students")
	}

	if students == nil {
		students = []map[string]interface{}{}
	}

	return h.JSONSuccess(c, "Students list", fiber.Map{
		"students":  students,
		"page":      page,
		"page_size": pageSize,
	})
}

// CreateStudent godoc
// @Summary Create a new student
// @Description Register a new student in the system and create a user account
// @Tags students
// @Accept json
// @Produce json
// @Param student body CreateStudentRequest true "Student Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /students [post]
func (h *StudentHandler) getTenantDB(c *fiber.Ctx) (*pgxpool.Pool, string) {
	tenantDB := middleware.GetTenantDB(c)
	tenantCode := middleware.GetTenantCode(c)

	if tenantDB != nil {
		return tenantDB, tenantCode
	}

	// Super admin fallback: try school_id from query or body
	if c.Locals("role") == "super_admin" {
		schoolID := c.Query("school_id")
		if schoolID == "" {
			// Try to parse from body if query is empty
			var body map[string]interface{}
			if err := c.BodyParser(&body); err == nil {
				if sid, ok := body["school_id"].(string); ok {
					schoolID = sid
				}
			}
		}

		if schoolID != "" {
			resolvedDB, resolvedCode, err := h.getTenantDBBySchoolID(c.Context(), schoolID)
			if err == nil {
				return resolvedDB, resolvedCode
			}
			log.Printf("[Student-Service] SuperAdmin fallback DB resolution failed for school %s: %v", schoolID, err)
		}
	}

	return nil, ""
}

func (h *StudentHandler) JSONError(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(fiber.Map{
		"error": message,
	})
}

func (h *StudentHandler) JSONSuccess(c *fiber.Ctx, message string, data interface{}) error {
	response := fiber.Map{
		"message": message,
	}
	if data != nil {
		// Use reflection or type switch if we want to merge keys, but for simplicity:
		if m, ok := data.(fiber.Map); ok {
			for k, v := range m {
				response[k] = v
			}
		} else {
			response["data"] = data
		}
	}
	return c.JSON(response)
}

func (h *StudentHandler) getTenantDBBySchoolID(ctx context.Context, schoolID string) (*pgxpool.Pool, string, error) {
	var dbUser, encryptedPassword, dbName, code string
	query := `SELECT db_user, db_password, db_name, code FROM schools WHERE id = $1 AND status = 'active'`
	err := h.db.QueryRow(ctx, query, schoolID).Scan(&dbUser, &encryptedPassword, &dbName, &code)
	if err != nil {
		return nil, "", fmt.Errorf("school not found or inactive: %w", err)
	}

	dbPort, _ := strconv.Atoi(h.cfg.DBPort)
	tenantDB, err := h.tm.GetConnection(
		ctx,
		code,
		h.cfg.DBHost,
		dbPort,
		dbName,
		dbUser,
		encryptedPassword,
		database.RunMigrations,
	)
	if err != nil {
		return nil, "", fmt.Errorf("failed to connect to tenant database: %w", err)
	}

	return tenantDB, code, nil
}

// CreateStudent godoc
// @Summary Create a new student
// @Description Register a new student in the system and create a user account
// @Tags students
// @Accept json
// @Produce json
// @Param student body CreateStudentRequest true "Student Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /students [post]
func (h *StudentHandler) CreateStudent(c *fiber.Ctx) error {
	var req CreateStudentRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("[Student-Service] BodyParser failed: %v", err)
		return h.JSONError(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate required fields
	if err := h.validator.Struct(req); err != nil {
		return h.JSONError(c, fiber.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
	}

	// Resolve Tenant DB
	tenantDB, tenantCode := h.getTenantDB(c)
	// Log only non-sensitive metadata for debugging resolution
	log.Printf("[Student-Service] DB resolution attempt: tenantCode=%s, role=%v", tenantCode, c.Locals("role"))

	// Special case for CreateStudent: if still nil, try resolving by req.SchoolID
	if tenantDB == nil && c.Locals("role") == "super_admin" && req.SchoolID != "" {
		log.Printf("[Student-Service] Super admin: resolving DB for SchoolID=%s", req.SchoolID)
		var err error
		tenantDB, tenantCode, err = h.getTenantDBBySchoolID(c.Context(), req.SchoolID)
		if err != nil {
			log.Printf("[Student-Service] DB resolution failed: %v", err)
			return h.JSONError(c, fiber.StatusInternalServerError, "Failed to resolve tenant database")
		}
		log.Printf("[Student-Service] Successfully resolved tenantCode=%s", tenantCode)
	}

	if tenantDB == nil {
		log.Printf("[Student-Service] No tenant database connected")
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	// 1. Create User in Auth Service
	userID, err := h.service.RegisterStudentAuth(c.Context(), req.Email, req.Password, req.FirstName, req.LastName, req.SchoolID, tenantCode)
	if err != nil {
		log.Printf("[Student-Service] Auth registration failed: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Authentication service error")
	}

	// 2. Sync User to Tenant DB
	err = h.service.SyncUserToTenant(c.Context(), tenantDB, userID, req.Email, req.FirstName, req.LastName, "student", req.SchoolID)
	if err != nil {
		log.Printf("[Student-Service] Warning: Failed to sync user to tenant DB: %v", err)
	}

	student := &database.Student{
		SchoolID:  req.SchoolID,
		UserID:    userID,
		FirstName: &req.FirstName,
		LastName:  &req.LastName,
		Email:     &req.Email,
		Class:     &req.ClassID,
	}
	if req.DateOfBirth != "" {
		if parsed, err := time.Parse("2006-01-02", req.DateOfBirth); err == nil {
			student.DateOfBirth = &parsed
		}
	}

	studentID, studentIDNumber, err := h.service.CreateStudent(c.Context(), tenantDB, student)
	if err != nil {
		log.Printf("[Student-Service] Failed to create student profile: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to create student profile")
	}

	return h.JSONSuccess(c, "Student created successfully", fiber.Map{
		"student_id":        studentID,
		"user_id":           userID,
		"student_id_number": studentIDNumber,
	})
}

// GetStudent godoc
// @Summary Get comprehensive student details
// @Description Get complete details of a specific student including all related information
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} database.StudentDetails
// @Failure 404 {object} map[string]interface{}
// @Router /students/{id} [get]
func (h *StudentHandler) GetStudent(c *fiber.Ctx) error {
	studentID := c.Params("id")

	tenantDB, tenantCode := h.getTenantDB(c)
	log.Printf("[Student-Service] GetStudent: id=%s, tenantCode=%s", studentID, tenantCode)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	studentDetails, err := h.service.GetStudentDetails(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] GetStudent failed for id %s: %v", studentID, err)
		return h.JSONError(c, fiber.StatusNotFound, "Student not found")
	}

	return c.JSON(studentDetails)
}

// SyncUserToTenant moved to StudentService

// GetStudentStatistics godoc
// @Summary Get student statistics
// @Description Get aggregated statistics for a student
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} database.StudentStatistics
// @Router /students/{id}/statistics [get]
func (h *StudentHandler) GetStudentStatistics(c *fiber.Ctx) error {
	studentID := c.Params("id")

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	stats, err := h.service.GetStudentStatistics(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch statistics: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch student statistics")
	}

	return h.JSONSuccess(c, "Student statistics", stats)
}

// GetStudentAcademics godoc
// @Summary Get student academic records
// @Description Get academic performance and grade history
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{id}/academics [get]
func (h *StudentHandler) GetStudentAcademics(c *fiber.Ctx) error {
	studentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	records, performance, err := h.service.GetStudentAcademics(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch academic records: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch academic records")
	}

	return h.JSONSuccess(c, "Academic records", fiber.Map{
		"records":     records,
		"performance": performance,
	})
}

// GetStudentAttendance godoc
// @Summary Get student attendance records
// @Description Get detailed attendance history and statistics
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{id}/attendance [get]
func (h *StudentHandler) GetStudentAttendance(c *fiber.Ctx) error {
	studentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	records, summaries, err := h.service.GetStudentAttendance(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch attendance: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch attendance records")
	}

	return h.JSONSuccess(c, "Attendance records", fiber.Map{
		"records":   records,
		"summaries": summaries,
	})
}

// GetStudentFees godoc
// @Summary Get student fee records
// @Description Get fee structure, payments, and outstanding balance
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{id}/fees [get]
func (h *StudentHandler) GetStudentFees(c *fiber.Ctx) error {
	studentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	payments, summaries, err := h.service.GetStudentFees(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch fee records: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch fee records")
	}

	return h.JSONSuccess(c, "Fee records", fiber.Map{
		"payments":  payments,
		"summaries": summaries,
	})
}

// GetStudentHealth godoc
// @Summary Get student health records
// @Description Get medical history and health information
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{id}/health [get]
func (h *StudentHandler) GetStudentHealth(c *fiber.Ctx) error {
	studentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	records, err := h.service.GetStudentHealth(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch health records: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch health records")
	}

	return h.JSONSuccess(c, "Health records", fiber.Map{"records": records})
}

// GetStudentBehavioral godoc
// @Summary Get student behavioral records
// @Description Get disciplinary and behavioral history
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{id}/behavioral [get]
func (h *StudentHandler) GetStudentBehavioral(c *fiber.Ctx) error {
	studentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	records, err := h.service.GetStudentBehavioral(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch behavioral records: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch behavioral records")
	}

	return h.JSONSuccess(c, "Behavioral records", fiber.Map{"records": records})
}

// GetStudentDocuments godoc
// @Summary Get student documents
// @Description Get list of uploaded documents
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{id}/documents [get]
func (h *StudentHandler) GetStudentDocuments(c *fiber.Ctx) error {
	studentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	documents, err := h.service.GetStudentDocuments(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch documents: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch student documents")
	}

	return h.JSONSuccess(c, "Student documents", fiber.Map{"documents": documents})
}

// GetStudentCommunications godoc
// @Summary Get parent communications
// @Description Get communication history with parents
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{id}/communications [get]
func (h *StudentHandler) GetStudentCommunications(c *fiber.Ctx) error {
	studentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to connect to tenant database")
	}

	communications, err := h.service.GetStudentCommunications(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch communications: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch communications")
	}

	return h.JSONSuccess(c, "Parent communications", fiber.Map{"communications": communications})
}

// Helper functions (Deprecated - moved to service)

// UpdateStudent godoc
// @Summary Update a student
// @Description Update details of an existing student
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Param student body CreateStudentRequest true "Student Data"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /students/{id} [put]
func (h *StudentHandler) UpdateStudent(c *fiber.Ctx) error {
	studentID := c.Params("id")

	// Get tenant database connection
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// Parse request body
	var req UpdateStudentRequest
	if err := c.BodyParser(&req); err != nil {
		return h.JSONError(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate fields
	if err := h.validator.Struct(req); err != nil {
		return h.JSONError(c, fiber.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
	}

	// Build white-listed UPDATE query
	updateFields := []string{}
	args := []interface{}{}
	argPos := 1

	// Explicitly map allowed fields to avoid mass assignment
	if req.FirstName != "" {
		updateFields = append(updateFields, fmt.Sprintf("first_name = $%d", argPos))
		args = append(args, req.FirstName)
		argPos++
	}
	if req.LastName != "" {
		updateFields = append(updateFields, fmt.Sprintf("last_name = $%d", argPos))
		args = append(args, req.LastName)
		argPos++
	}
	if req.Email != "" {
		updateFields = append(updateFields, fmt.Sprintf("email = $%d", argPos))
		args = append(args, req.Email)
		argPos++
	}
	if req.DateOfBirth != "" {
		parsedDate, err := time.Parse("2006-01-02", req.DateOfBirth)
		if err != nil {
			return h.JSONError(c, fiber.StatusBadRequest, "Invalid date format for date_of_birth. Use YYYY-MM-DD")
		}
		updateFields = append(updateFields, fmt.Sprintf("date_of_birth = $%d", argPos))
		args = append(args, parsedDate)
		argPos++
	}
	if req.Gender != "" {
		updateFields = append(updateFields, fmt.Sprintf("gender = $%d", argPos))
		args = append(args, req.Gender)
		argPos++
	}
	if req.Nationality != "" {
		updateFields = append(updateFields, fmt.Sprintf("nationality = $%d", argPos))
		args = append(args, req.Nationality)
		argPos++
	}
	if req.Class != "" {
		updateFields = append(updateFields, fmt.Sprintf("class = $%d", argPos))
		args = append(args, req.Class)
		argPos++
	}
	if req.Section != "" {
		updateFields = append(updateFields, fmt.Sprintf("section = $%d", argPos))
		args = append(args, req.Section)
		argPos++
	}
	if req.RollNumber != "" {
		updateFields = append(updateFields, fmt.Sprintf("roll_number = $%d", argPos))
		args = append(args, req.RollNumber)
		argPos++
	}
	if req.BloodGroup != "" {
		updateFields = append(updateFields, fmt.Sprintf("blood_group = $%d", argPos))
		args = append(args, req.BloodGroup)
		argPos++
	}
	if req.Phone != "" {
		updateFields = append(updateFields, fmt.Sprintf("phone = $%d", argPos))
		args = append(args, req.Phone)
		argPos++
	}
	if req.Address != "" {
		updateFields = append(updateFields, fmt.Sprintf("address = $%d", argPos))
		args = append(args, req.Address)
		argPos++
	}
	if req.PhotoURL != "" {
		updateFields = append(updateFields, fmt.Sprintf("photo_url = $%d", argPos))
		args = append(args, req.PhotoURL)
		argPos++
	}
	if req.Status != "" {
		updateFields = append(updateFields, fmt.Sprintf("status = $%d", argPos))
		args = append(args, req.Status)
		argPos++
	}
	if req.EnrollmentDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.EnrollmentDate)
		if err == nil {
			updateFields = append(updateFields, fmt.Sprintf("enrollment_date = $%d", argPos))
			args = append(args, parsedDate)
			argPos++
		}
	}
	if req.AdmissionDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.AdmissionDate)
		if err == nil {
			updateFields = append(updateFields, fmt.Sprintf("admission_date = $%d", argPos))
			args = append(args, parsedDate)
			argPos++
		}
	}
	if req.Notes != "" {
		updateFields = append(updateFields, fmt.Sprintf("notes = $%d", argPos))
		args = append(args, req.Notes)
		argPos++
	}

	// Always update updated_at timestamp
	updateFields = append(updateFields, fmt.Sprintf("updated_at = $%d", argPos))
	args = append(args, time.Now())
	argPos++

	// Add student ID as the last parameter
	args = append(args, studentID)

	if len(updateFields) == 1 { // Only updated_at was added
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No fields to update",
		})
	}

	var updatedID int64
	var userID, email, firstName, lastName, scID *string
	updatedID, err := h.service.UpdateStudent(c.Context(), tenantDB, studentID, updateFields, args)
	if err != nil {
		if err.Error() == "no rows in result set" || strings.Contains(err.Error(), "no rows") {
			return h.JSONError(c, fiber.StatusNotFound, "Student not found")
		}
		log.Printf("[Student-Service] Failed to update student (ID: %s): %v", studentID, err)
		return h.JSONError(c, fiber.StatusInternalServerError, fmt.Sprintf("Failed to update student: %v", err))
	}

	// 4. Fetch updated details to sync with tenant users table
	// Use pointers for Scan to avoid "cannot scan NULL into string" errors
	err = tenantDB.QueryRow(c.Context(), "SELECT user_id, email, first_name, last_name, school_id FROM students WHERE id = $1", updatedID).
		Scan(&userID, &email, &firstName, &lastName, &scID)
	if err == nil && userID != nil && email != nil && firstName != nil && lastName != nil && scID != nil {
		h.service.SyncUserToTenant(c.Context(), tenantDB, *userID, *email, *firstName, *lastName, "student", *scID)
	} else if err != nil {
		log.Printf("[Student-Service] Warning: Failed to fetch updated details for sync: %v", err)
	}

	return h.JSONSuccess(c, "Student updated successfully", fiber.Map{
		"student_id": updatedID,
	})
}

// DeleteStudent godoc
// @Summary Delete a student
// @Description Remove a student from the system
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /students/{id} [delete]
func (h *StudentHandler) DeleteStudent(c *fiber.Ctx) error {
	studentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusUnauthorized, "Tenant database not resolved")
	}

	if err := h.service.DeleteStudent(c.Context(), tenantDB, studentID); err != nil {
		log.Printf("[Student-Service] Failed to delete student: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to delete student")
	}

	return h.JSONSuccess(c, "Student deleted successfully", fiber.Map{"student_id": studentID})
}

// GetStudentEnrollments godoc
// @Summary Get student enrollments
// @Description Get a list of class enrollments for a student
// @Tags students
// @Accept json
// @Produce json
// @Param student_id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{student_id}/enrollments [get]
func (h *StudentHandler) GetStudentEnrollments(c *fiber.Ctx) error {
	studentID := c.Params("student_id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusUnauthorized, "Tenant database not resolved")
	}

	enrollments, err := h.service.GetStudentEnrollments(c.Context(), tenantDB, studentID)
	if err != nil {
		log.Printf("[Student-Service] Failed to fetch enrollments: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to fetch enrollments")
	}

	return h.JSONSuccess(c, "Student enrollments", fiber.Map{
		"student_id":  studentID,
		"enrollments": enrollments,
	})
}

// EnrollStudent godoc
// @Summary Enroll a student
// @Description Enroll a student in a class
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollment body EnrollmentRequest true "Enrollment Data"
// @Success 201 {object} map[string]interface{}
// @Router /enrollments [post]
func (h *StudentHandler) EnrollStudent(c *fiber.Ctx) error {
	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return h.JSONError(c, fiber.StatusBadRequest, "Invalid request body")
	}

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusUnauthorized, "Tenant database not resolved")
	}

	if err := h.service.EnrollStudent(c.Context(), tenantDB, req); err != nil {
		log.Printf("[Student-Service] Failed to enroll student: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to enroll student")
	}

	return h.JSONSuccess(c, "Student enrolled successfully", nil)
}

// RemoveEnrollment godoc
// @Summary Remove enrollment
// @Description Remove a student from a class
// @Tags enrollments
// @Accept json
// @Produce json
// @Param id path string true "Enrollment ID"
// @Success 200 {object} map[string]interface{}
// @Router /enrollments/{id} [delete]
func (h *StudentHandler) RemoveEnrollment(c *fiber.Ctx) error {
	enrollmentID := c.Params("id")
	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return h.JSONError(c, fiber.StatusUnauthorized, "Tenant database not resolved")
	}

	if err := h.service.RemoveEnrollment(c.Context(), tenantDB, enrollmentID); err != nil {
		log.Printf("[Student-Service] Failed to remove enrollment: %v", err)
		return h.JSONError(c, fiber.StatusInternalServerError, "Failed to remove enrollment")
	}

	return h.JSONSuccess(c, "Enrollment removed successfully", fiber.Map{"enrollment_id": enrollmentID})
}

// Standard helpers JSONError and JSONSuccess are kept in student.go as they are shared by all handlers
