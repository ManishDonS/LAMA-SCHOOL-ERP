package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/student/config"
	"school-erp/student/database"
	"school-erp/student/middleware"
	"school-erp/student/pkg/tenant"
)

type StudentHandler struct {
	db  *pgxpool.Pool
	cfg *config.Config
	tm  *tenant.TenantManager
}

type CreateStudentRequest struct {
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	DateOfBirth string `json:"date_of_birth"`
	ClassID     string `json:"class_id"`
	SchoolID    string `json:"school_id"`
}

type UpdateStudentRequest struct {
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	DateOfBirth string `json:"date_of_birth"`
	Gender      string `json:"gender"`
	Nationality string `json:"nationality"`
	Class       string `json:"class"`
	Section     string `json:"section"`
	RollNumber  string `json:"roll_number"`
	BloodGroup  string `json:"blood_group"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`
	PhotoURL    string `json:"photo_url"`
}

type EnrollmentRequest struct {
	StudentID    string `json:"student_id"`
	ClassID      string `json:"class_id"`
	AcademicYear string `json:"academic_year"`
}

func NewStudentHandler(db *pgxpool.Pool, cfg *config.Config, tm *tenant.TenantManager) *StudentHandler {
	return &StudentHandler{db: db, cfg: cfg, tm: tm}
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
	ctx := context.Background()
	tenantDB, tenantCode := h.getTenantDB(c)
	log.Printf("[Student-Service] ListStudents: tenantCode=%s", tenantCode)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	query := `
		SELECT id, first_name, last_name, student_id_number, class, section, 
		       email, phone, status
		FROM students
		ORDER BY created_at DESC
	`

	rows, err := tenantDB.Query(ctx, query)
	if err != nil {
		log.Printf("Failed to query students: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch students",
		})
	}
	defer rows.Close()

	var students []fiber.Map
	for rows.Next() {
		var (
			id              int64
			firstName       string
			lastName        string
			studentIDNumber string
			className       string
			section         *string // Nullable
			email           string
			phone           *string // Nullable
			status          string
		)
		if err := rows.Scan(&id, &firstName, &lastName, &studentIDNumber, &className, &section, &email, &phone, &status); err != nil {
			log.Printf("Failed to scan student row: %v", err)
			continue
		}

		// Handle nullable fields safely
		sectionStr := ""
		if section != nil {
			sectionStr = *section
		}
		phoneStr := ""
		if phone != nil {
			phoneStr = *phone
		}

		students = append(students, fiber.Map{
			"id":                id,
			"first_name":        firstName,
			"last_name":         lastName,
			"student_id_number": studentIDNumber,
			"class":             className,
			"section":           sectionStr,
			"email":             email,
			"primary_phone":     phoneStr, // Mapping to frontend expectation 'primary_phone' or similar
			"status":            status,
		})
	}

	if students == nil {
		students = []fiber.Map{}
	}

	return c.JSON(fiber.Map{
		"message":  "Students list",
		"students": students,
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

	// Super admin fallback
	if c.Locals("role") == "super_admin" {
		schoolID := c.Query("school_id")
		if schoolID == "" {
			// Try to get from body if it's a POST/PUT request
			// Note: This requires body to be parsed already, which might not be the case for all handlers
			// For now we'll rely on query param or specific handler logic like CreateStudent
		}

		if schoolID != "" {
			resolvedDB, resolvedCode, err := h.getTenantDBBySchoolID(context.Background(), schoolID)
			if err == nil {
				return resolvedDB, resolvedCode
			}
		}
	}

	return nil, ""
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
		log.Printf("BodyParser failed: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body (DEBUG)",
			"details": err.Error(),
		})
	}

	// Validate required fields
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing required fields (email, password, first_name, last_name)",
		})
	}

	// Resolve Tenant DB
	ctx := context.Background()
	tenantDB, tenantCode := h.getTenantDB(c)
	log.Printf("[Student-Service] Resolve attempt: tenantCode=%s, role=%v, req.SchoolID=%s", tenantCode, c.Locals("role"), req.SchoolID)

	// Special case for CreateStudent: if still nil, try resolving by req.SchoolID
	if tenantDB == nil && c.Locals("role") == "super_admin" && req.SchoolID != "" {
		log.Printf("[Student-Service] Super admin: resolving DB for SchoolID=%s", req.SchoolID)
		var err error
		tenantDB, tenantCode, err = h.getTenantDBBySchoolID(ctx, req.SchoolID)
		if err != nil {
			log.Printf("[Student-Service] DB resolution failed: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Failed to resolve tenant database for super admin",
				"details": err.Error(),
			})
		}
		log.Printf("[Student-Service] Successfully resolved tenantCode=%s", tenantCode)
	}

	if tenantDB == nil {
		log.Printf("[Student-Service] No tenant database connected")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// 1. Create User in Auth Service
	authPayload := map[string]interface{}{
		"email":      req.Email,
		"password":   req.Password,
		"first_name": req.FirstName,
		"last_name":  req.LastName,
		"role":       "student",
		"school_id":  req.SchoolID,
	}

	authBody, err := json.Marshal(authPayload)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to prepare auth request"})
	}

	authURL := fmt.Sprintf("%s/api/v1/auth/register", h.cfg.AuthServiceURL)

	// Create request
	proxyReq, err := http.NewRequest("POST", authURL, bytes.NewBuffer(authBody))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create auth request"})
	}
	proxyReq.Header.Set("Content-Type", "application/json")

	// Forward Tenant Code
	if tenantCode != "" {
		proxyReq.Header.Set("X-Tenant-Code", tenantCode)
	}

	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to connect to Auth Service"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		var authErr map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&authErr)
		return c.Status(resp.StatusCode).JSON(authErr)
	}

	var authResp struct {
		Data struct {
			UserID string `json:"user_id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse auth response"})
	}

	userID := authResp.Data.UserID

	// 2. Sync User to Tenant DB (Crucial for list join!)
	err = h.SyncUserToTenant(ctx, tenantDB, userID, req.Email, req.FirstName, req.LastName, "student", req.SchoolID)
	if err != nil {
		log.Printf("[Student-Service] Warning: Failed to sync user to tenant DB: %v", err)
	}

	// 3. Create Student in Database
	query := `
		INSERT INTO students (
			school_id, user_id, first_name, last_name, email, 
			roll_number, class, admission_date, date_of_birth, status, created_at, updated_at,
			student_id_number
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
		RETURNING id
	`

	var dob *time.Time
	if req.DateOfBirth != "" {
		parsedDate, err := time.Parse("2006-01-02", req.DateOfBirth)
		if err == nil {
			dob = &parsedDate
		}
	}

	// Generate Student ID
	studentIDNumber, err := h.generateStudentID(ctx, tenantDB)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate student ID",
		})
	}

	admissionDate := time.Now()

	var studentID int64
	err = tenantDB.QueryRow(ctx, query,
		req.SchoolID, userID, req.FirstName, req.LastName, req.Email,
		studentIDNumber, // roll_number (using student ID for now)
		req.ClassID,     // class
		admissionDate,   // admission_date
		dob, "active",
		studentIDNumber, // student_id_number
	).Scan(&studentID)

	if err != nil {
		// Note: In a real system, we should rollback web user creation here or use a saga.
		// For now, logging the inconsistency is acceptable or we could attempt to delete the user.
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to create student profile",
			"details": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":           "Student created successfully",
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
	ctx := context.Background()

	tenantDB, tenantCode := h.getTenantDB(c)
	log.Printf("[Student-Service] GetStudent: id=%s, tenantCode=%s", studentID, tenantCode)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// Get basic student info
	var student database.Student
	query := `
		SELECT id, school_id, user_id, first_name, last_name, date_of_birth, 
		       gender, nationality, student_id_number, roll_number, class, section,
		       enrollment_date, admission_date, blood_group, photo_url, email, phone,
		       address, status, created_at, updated_at
		FROM students WHERE id = $1
	`
	err := tenantDB.QueryRow(ctx, query, studentID).Scan(
		&student.ID, &student.SchoolID, &student.UserID, &student.FirstName,
		&student.LastName, &student.DateOfBirth, &student.Gender, &student.Nationality,
		&student.StudentIDNumber, &student.RollNumber, &student.Class, &student.Section,
		&student.EnrollmentDate, &student.AdmissionDate, &student.BloodGroup, &student.PhotoURL,
		&student.Email, &student.Phone, &student.Address, &student.Status,
		&student.CreatedAt, &student.UpdatedAt,
	)
	if err != nil {
		log.Printf("[Student-Service] GetStudent failed for id %s: %v", studentID, err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":      "Student not found",
			"debug_info": fmt.Sprintf("ID: %s, Tenant: %s, Error: %v", studentID, tenantCode, err),
		})
	}

	// Get guardians
	guardians, _ := h.getStudentGuardians(ctx, studentID, tenantDB)

	// Get emergency contacts
	emergencyContacts, _ := h.getEmergencyContacts(ctx, studentID, tenantDB)

	// Get current academic performance
	currentPerformance, _ := h.getCurrentPerformance(ctx, studentID, tenantDB)

	// Get attendance summary
	attendanceSummary, _ := h.getAttendanceSummary(ctx, studentID, tenantDB)

	// Get fee summary
	feeSummary, _ := h.getFeeSummary(ctx, studentID, tenantDB)

	// Get recent activities
	recentActivities, _ := h.getRecentActivities(ctx, studentID, 10, tenantDB)

	details := database.StudentDetails{
		Student:            student,
		Guardians:          guardians,
		EmergencyContacts:  emergencyContacts,
		CurrentPerformance: currentPerformance,
		AttendanceSummary:  attendanceSummary,
		FeeSummary:         feeSummary,
		RecentActivities:   recentActivities,
	}

	return c.JSON(details)
}

func (h *StudentHandler) SyncUserToTenant(ctx context.Context, tenantDB *pgxpool.Pool, userID string, email, firstName, lastName, role, schoolID string) error {
	query := `
		INSERT INTO users (id, email, first_name, last_name, role, password_hash, status, school_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			email = EXCLUDED.email,
			first_name = EXCLUDED.first_name,
			last_name = EXCLUDED.last_name,
			role = EXCLUDED.role,
			school_id = EXCLUDED.school_id,
			updated_at = NOW()
	`
	_, err := tenantDB.Exec(ctx, query, userID, email, firstName, lastName, role, "EXTERNAL_AUTH", "active", schoolID)
	return err
}

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
	ctx := context.Background()

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	stats := database.StudentStatistics{StudentID: 0}

	// Get overall attendance
	query := `
		SELECT COALESCE(AVG(attendance_percentage), 0)
		FROM attendance_summary
		WHERE student_id = $1
	`
	tenantDB.QueryRow(ctx, query, studentID).Scan(&stats.OverallAttendance)

	// Get current GPA and percentage
	query = `
		SELECT COALESCE(gpa, 0), COALESCE(percentage, 0)
		FROM academic_performance
		WHERE student_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	tenantDB.QueryRow(ctx, query, studentID).Scan(&stats.CurrentGPA, &stats.CurrentPercentage)

	// Get fee statistics
	query = `
		SELECT COALESCE(paid_amount, 0), COALESCE(outstanding_amount, 0)
		FROM fee_summary
		WHERE student_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	tenantDB.QueryRow(ctx, query, studentID).Scan(&stats.TotalFeesPaid, &stats.OutstandingFees)

	// Get behavior points
	query = `
		SELECT COALESCE(SUM(points), 0)
		FROM behavioral_records
		WHERE student_id = $1
	`
	tenantDB.QueryRow(ctx, query, studentID).Scan(&stats.BehaviorPoints)

	// Get absence and late counts
	query = `
		SELECT 
			COALESCE(SUM(absent_days), 0),
			COALESCE(SUM(late_days), 0)
		FROM attendance_summary
		WHERE student_id = $1
	`
	tenantDB.QueryRow(ctx, query, studentID).Scan(&stats.TotalAbsences, &stats.TotalLateDays)

	// Get document count
	query = `SELECT COUNT(*) FROM student_documents WHERE student_id = $1`
	tenantDB.QueryRow(ctx, query, studentID).Scan(&stats.DocumentsCount)

	// Get health records count
	query = `SELECT COUNT(*) FROM health_records WHERE student_id = $1`
	tenantDB.QueryRow(ctx, query, studentID).Scan(&stats.HealthRecordsCount)

	return c.JSON(stats)
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
	ctx := context.Background()

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// Get academic records
	query := `
		SELECT id, student_id, academic_year, term, subject, marks_obtained,
		       total_marks, grade, percentage, remarks, teacher_id, created_at, updated_at
		FROM academic_records
		WHERE student_id = $1
		ORDER BY academic_year DESC, term DESC, subject ASC
	`
	rows, err := tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch academic records"})
	}
	defer rows.Close()

	var records []database.AcademicRecord
	for rows.Next() {
		var record database.AcademicRecord
		rows.Scan(&record.ID, &record.StudentID, &record.AcademicYear, &record.Term,
			&record.Subject, &record.MarksObtained, &record.TotalMarks, &record.Grade,
			&record.Percentage, &record.Remarks, &record.TeacherID, &record.CreatedAt, &record.UpdatedAt)
		records = append(records, record)
	}

	// Get performance summary
	query = `
		SELECT id, student_id, academic_year, term, gpa, percentage, rank,
		       total_students, remarks, created_at, updated_at
		FROM academic_performance
		WHERE student_id = $1
		ORDER BY academic_year DESC, term DESC
	`
	rows, err = tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch performance"})
	}
	defer rows.Close()

	var performance []database.AcademicPerformance
	for rows.Next() {
		var perf database.AcademicPerformance
		rows.Scan(&perf.ID, &perf.StudentID, &perf.AcademicYear, &perf.Term, &perf.GPA,
			&perf.Percentage, &perf.Rank, &perf.TotalStudents, &perf.Remarks,
			&perf.CreatedAt, &perf.UpdatedAt)
		performance = append(performance, perf)
	}

	return c.JSON(fiber.Map{
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
	ctx := context.Background()

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// Get attendance records (last 90 days)
	query := `
		SELECT id, student_id, date, status, check_in_time, check_out_time,
		       reason, marked_by, created_at, updated_at
		FROM attendance_records
		WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '90 days'
		ORDER BY date DESC
	`
	rows, err := tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch attendance"})
	}
	defer rows.Close()

	var records []database.AttendanceRecord
	for rows.Next() {
		var record database.AttendanceRecord
		rows.Scan(&record.ID, &record.StudentID, &record.Date, &record.Status,
			&record.CheckInTime, &record.CheckOutTime, &record.Reason, &record.MarkedBy,
			&record.CreatedAt, &record.UpdatedAt)
		records = append(records, record)
	}

	// Get monthly summaries
	query = `
		SELECT id, student_id, academic_year, month, total_days, present_days,
		       absent_days, late_days, excused_days, attendance_percentage,
		       created_at, updated_at
		FROM attendance_summary
		WHERE student_id = $1
		ORDER BY academic_year DESC, month DESC
		LIMIT 12
	`
	rows, err = tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch summary"})
	}
	defer rows.Close()

	var summaries []database.AttendanceSummary
	for rows.Next() {
		var summary database.AttendanceSummary
		rows.Scan(&summary.ID, &summary.StudentID, &summary.AcademicYear, &summary.Month,
			&summary.TotalDays, &summary.PresentDays, &summary.AbsentDays, &summary.LateDays,
			&summary.ExcusedDays, &summary.AttendancePercentage, &summary.CreatedAt, &summary.UpdatedAt)
		summaries = append(summaries, summary)
	}

	return c.JSON(fiber.Map{
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
	ctx := context.Background()

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// Get fee payments
	query := `
		SELECT id, student_id, academic_year, fee_type, amount_paid, payment_date,
		       payment_method, transaction_id, receipt_number, remarks, received_by,
		       created_at, updated_at
		FROM fee_payments
		WHERE student_id = $1
		ORDER BY payment_date DESC
	`
	rows, err := tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch payments"})
	}
	defer rows.Close()

	var payments []database.FeePayment
	for rows.Next() {
		var payment database.FeePayment
		rows.Scan(&payment.ID, &payment.StudentID, &payment.AcademicYear, &payment.FeeType,
			&payment.AmountPaid, &payment.PaymentDate, &payment.PaymentMethod, &payment.TransactionID,
			&payment.ReceiptNumber, &payment.Remarks, &payment.ReceivedBy, &payment.CreatedAt, &payment.UpdatedAt)
		payments = append(payments, payment)
	}

	// Get fee summary
	query = `
		SELECT id, student_id, academic_year, total_fee, paid_amount, outstanding_amount,
		       last_payment_date, created_at, updated_at
		FROM fee_summary
		WHERE student_id = $1
		ORDER BY academic_year DESC
	`
	rows, err = tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch summary"})
	}
	defer rows.Close()

	var summaries []database.FeeSummary
	for rows.Next() {
		var summary database.FeeSummary
		rows.Scan(&summary.ID, &summary.StudentID, &summary.AcademicYear, &summary.TotalFee,
			&summary.PaidAmount, &summary.OutstandingAmount, &summary.LastPaymentDate,
			&summary.CreatedAt, &summary.UpdatedAt)
		summaries = append(summaries, summary)
	}

	return c.JSON(fiber.Map{
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
	ctx := context.Background()

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	query := `
		SELECT id, student_id, record_type, title, description, severity,
		       diagnosed_date, doctor_name, hospital, prescription, notes,
		       created_at, updated_at
		FROM health_records
		WHERE student_id = $1
		ORDER BY created_at DESC
	`
	rows, err := tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch health records"})
	}
	defer rows.Close()

	var records []database.HealthRecord
	for rows.Next() {
		var record database.HealthRecord
		rows.Scan(&record.ID, &record.StudentID, &record.RecordType, &record.Title,
			&record.Description, &record.Severity, &record.DiagnosedDate, &record.DoctorName,
			&record.Hospital, &record.Prescription, &record.Notes, &record.CreatedAt, &record.UpdatedAt)
		records = append(records, record)
	}

	return c.JSON(fiber.Map{"records": records})
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
	ctx := context.Background()

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	query := `
		SELECT id, student_id, record_type, category, title, description,
		       incident_date, action_taken, reported_by, severity, points,
		       created_at, updated_at
		FROM behavioral_records
		WHERE student_id = $1
		ORDER BY incident_date DESC
	`
	rows, err := tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch behavioral records"})
	}
	defer rows.Close()

	var records []database.BehavioralRecord
	for rows.Next() {
		var record database.BehavioralRecord
		rows.Scan(&record.ID, &record.StudentID, &record.RecordType, &record.Category,
			&record.Title, &record.Description, &record.IncidentDate, &record.ActionTaken,
			&record.ReportedBy, &record.Severity, &record.Points, &record.CreatedAt, &record.UpdatedAt)
		records = append(records, record)
	}

	return c.JSON(fiber.Map{"records": records})
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
	ctx := context.Background()

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	query := `
		SELECT id, student_id, document_type, title, file_name, file_path,
		       file_size, mime_type, is_verified, verified_by, verified_at,
		       uploaded_by, created_at, updated_at
		FROM student_documents
		WHERE student_id = $1
		ORDER BY created_at DESC
	`
	rows, err := tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch documents"})
	}
	defer rows.Close()

	var documents []database.StudentDocument
	for rows.Next() {
		var doc database.StudentDocument
		rows.Scan(&doc.ID, &doc.StudentID, &doc.DocumentType, &doc.Title, &doc.FileName,
			&doc.FilePath, &doc.FileSize, &doc.MimeType, &doc.IsVerified, &doc.VerifiedBy,
			&doc.VerifiedAt, &doc.UploadedBy, &doc.CreatedAt, &doc.UpdatedAt)
		documents = append(documents, doc)
	}

	return c.JSON(fiber.Map{"documents": documents})
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
	ctx := context.Background()

	tenantDB, _ := h.getTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	query := `
		SELECT id, student_id, communication_type, subject, message,
		       communication_date, initiated_by, teacher_id, parent_id,
		       status, notes, created_at, updated_at
		FROM parent_communications
		WHERE student_id = $1
		ORDER BY communication_date DESC
	`
	rows, err := tenantDB.Query(ctx, query, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch communications"})
	}
	defer rows.Close()

	var communications []database.ParentCommunication
	for rows.Next() {
		var comm database.ParentCommunication
		rows.Scan(&comm.ID, &comm.StudentID, &comm.CommunicationType, &comm.Subject,
			&comm.Message, &comm.CommunicationDate, &comm.InitiatedBy, &comm.TeacherID,
			&comm.ParentID, &comm.Status, &comm.Notes, &comm.CreatedAt, &comm.UpdatedAt)
		communications = append(communications, comm)
	}

	return c.JSON(fiber.Map{"communications": communications})
}

// Helper functions
func (h *StudentHandler) getStudentGuardians(ctx context.Context, studentID string, db *pgxpool.Pool) ([]database.StudentGuardian, error) {
	query := `
		SELECT id, student_id, guardian_type, name, relationship, phone, email,
		       occupation, address, is_primary, created_at, updated_at
		FROM student_guardians
		WHERE student_id = $1
		ORDER BY is_primary DESC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var guardians []database.StudentGuardian
	for rows.Next() {
		var guardian database.StudentGuardian
		rows.Scan(&guardian.ID, &guardian.StudentID, &guardian.GuardianType, &guardian.Name,
			&guardian.Relationship, &guardian.Phone, &guardian.Email, &guardian.Occupation,
			&guardian.Address, &guardian.IsPrimary, &guardian.CreatedAt, &guardian.UpdatedAt)
		guardians = append(guardians, guardian)
	}
	return guardians, nil
}

func (h *StudentHandler) getEmergencyContacts(ctx context.Context, studentID string, db *pgxpool.Pool) ([]database.EmergencyContact, error) {
	query := `
		SELECT id, student_id, name, relationship, phone, alternate_phone,
		       address, priority, created_at, updated_at
		FROM emergency_contacts
		WHERE student_id = $1
		ORDER BY priority ASC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []database.EmergencyContact
	for rows.Next() {
		var contact database.EmergencyContact
		rows.Scan(&contact.ID, &contact.StudentID, &contact.Name, &contact.Relationship,
			&contact.Phone, &contact.AlternatePhone, &contact.Address, &contact.Priority,
			&contact.CreatedAt, &contact.UpdatedAt)
		contacts = append(contacts, contact)
	}
	return contacts, nil
}

func (h *StudentHandler) getCurrentPerformance(ctx context.Context, studentID string, db *pgxpool.Pool) (*database.AcademicPerformance, error) {
	var perf database.AcademicPerformance
	query := `
		SELECT id, student_id, academic_year, term, gpa, percentage, rank,
		       total_students, remarks, created_at, updated_at
		FROM academic_performance
		WHERE student_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	err := db.QueryRow(ctx, query, studentID).Scan(
		&perf.ID, &perf.StudentID, &perf.AcademicYear, &perf.Term, &perf.GPA,
		&perf.Percentage, &perf.Rank, &perf.TotalStudents, &perf.Remarks,
		&perf.CreatedAt, &perf.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &perf, nil
}

func (h *StudentHandler) getAttendanceSummary(ctx context.Context, studentID string, db *pgxpool.Pool) (*database.AttendanceSummary, error) {
	var summary database.AttendanceSummary
	query := `
		SELECT id, student_id, academic_year, month, total_days, present_days,
		       absent_days, late_days, excused_days, attendance_percentage,
		       created_at, updated_at
		FROM attendance_summary
		WHERE student_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	err := db.QueryRow(ctx, query, studentID).Scan(
		&summary.ID, &summary.StudentID, &summary.AcademicYear, &summary.Month,
		&summary.TotalDays, &summary.PresentDays, &summary.AbsentDays, &summary.LateDays,
		&summary.ExcusedDays, &summary.AttendancePercentage, &summary.CreatedAt, &summary.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &summary, nil
}

func (h *StudentHandler) getFeeSummary(ctx context.Context, studentID string, db *pgxpool.Pool) (*database.FeeSummary, error) {
	var summary database.FeeSummary
	query := `
		SELECT id, student_id, academic_year, total_fee, paid_amount, outstanding_amount,
		       last_payment_date, created_at, updated_at
		FROM fee_summary
		WHERE student_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	err := db.QueryRow(ctx, query, studentID).Scan(
		&summary.ID, &summary.StudentID, &summary.AcademicYear, &summary.TotalFee,
		&summary.PaidAmount, &summary.OutstandingAmount, &summary.LastPaymentDate,
		&summary.CreatedAt, &summary.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &summary, nil
}

func (h *StudentHandler) getRecentActivities(ctx context.Context, studentID string, limit int, db *pgxpool.Pool) ([]database.StudentActivity, error) {
	query := fmt.Sprintf(`
		SELECT id, student_id, activity_type, title, description, metadata,
		       performed_by, activity_date, created_at
		FROM student_activities
		WHERE student_id = $1
		ORDER BY activity_date DESC
		LIMIT %d
	`, limit)

	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var activities []database.StudentActivity
	for rows.Next() {
		var activity database.StudentActivity

		rows.Scan(&activity.ID, &activity.StudentID, &activity.ActivityType, &activity.Title,
			&activity.Description, &activity.Metadata, &activity.PerformedBy, &activity.ActivityDate,
			&activity.CreatedAt)
		activities = append(activities, activity)
	}
	return activities, nil
}

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
	ctx := context.Background()

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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
	}

	// Build dynamic UPDATE query based on provided fields
	updateFields := []string{}
	args := []interface{}{}
	argPos := 1

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
		updateFields = append(updateFields, fmt.Sprintf("date_of_birth = $%d", argPos))
		args = append(args, req.DateOfBirth)
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

	// Build and execute UPDATE query
	query := fmt.Sprintf(
		"UPDATE students SET %s WHERE id = $%d RETURNING id",
		strings.Join(updateFields, ", "),
		argPos,
	)

	var updatedID int64
	var userID, email, firstName, lastName, scID string
	err := tenantDB.QueryRow(ctx, query, args...).Scan(&updatedID)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Student not found",
			})
		}
		log.Printf("Failed to update student: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to update student",
			"details": err.Error(),
		})
	}

	// 4. Fetch updated details to sync with tenant users table
	err = tenantDB.QueryRow(ctx, "SELECT user_id, email, first_name, last_name, school_id FROM students WHERE id = $1", updatedID).
		Scan(&userID, &email, &firstName, &lastName, &scID)
	if err == nil {
		h.SyncUserToTenant(ctx, tenantDB, userID, email, firstName, lastName, "student", scID)
	}

	return c.JSON(fiber.Map{
		"message":    "Student updated successfully",
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
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Student deleted", "student_id": id})
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
	return c.JSON(fiber.Map{"message": "Enrollments", "student_id": studentID, "enrollments": []fiber.Map{}})
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
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Student enrolled"})
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
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Enrollment removed", "enrollment_id": id})
}

func (h *StudentHandler) generateStudentID(ctx context.Context, db *pgxpool.Pool) (string, error) {
	year := time.Now().Year()
	prefix := fmt.Sprintf("STU-%d", year)

	// Find the last student ID for this year
	query := `
		SELECT roll_number 
		FROM students 
		WHERE roll_number LIKE $1 
		ORDER BY id DESC 
		LIMIT 1
	`

	var lastID string
	err := db.QueryRow(ctx, query, prefix+"%").Scan(&lastID)

	if err != nil {
		if err.Error() == "no rows in result set" {
			return fmt.Sprintf("%s-0001", prefix), nil
		}
		return "", err
	}

	// Extract sequence
	// Expected format: STU-YYYY-XXXX
	var sequence int
	_, err = fmt.Sscanf(lastID, prefix+"-%d", &sequence)
	if err != nil {
		// Fallback if existing IDs don't match format
		return fmt.Sprintf("%s-0001", prefix), nil
	}

	return fmt.Sprintf("%s-%04d", prefix, sequence+1), nil
}
