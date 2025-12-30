package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"school-erp/student/database"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type DB interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type StudentService struct {
	authServiceURL string
}

func NewStudentService(authServiceURL string) *StudentService {
	return &StudentService{
		authServiceURL: authServiceURL,
	}
}

func (s *StudentService) ListStudents(ctx context.Context, db DB, limit, offset int) ([]map[string]interface{}, error) {
	query := `
		SELECT id, first_name, last_name, student_id_number, class, section, 
		       email, phone, status
		FROM students
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []map[string]interface{}
	for rows.Next() {
		var (
			id              int64
			firstName       *string
			lastName        *string
			studentIDNumber *string
			className       *string
			section         *string
			email           *string
			phone           *string
			status          string
		)
		if err := rows.Scan(&id, &firstName, &lastName, &studentIDNumber, &className, &section, &email, &phone, &status); err != nil {
			return nil, fmt.Errorf("failed to scan student row: %w", err)
		}

		students = append(students, map[string]interface{}{
			"id":                id,
			"first_name":        firstName,
			"last_name":         lastName,
			"student_id_number": studentIDNumber,
			"class":             className,
			"section":           section,
			"email":             email,
			"primary_phone":     phone,
			"status":            status,
		})
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after scanning students: %w", err)
	}

	return students, nil
}

func (s *StudentService) RegisterStudentAuth(ctx context.Context, email, password, firstName, lastName, schoolID, tenantCode string) (string, error) {
	authPayload := map[string]interface{}{
		"email":      email,
		"password":   password,
		"first_name": firstName,
		"last_name":  lastName,
		"role":       "student",
		"school_id":  schoolID,
	}

	authBody, err := json.Marshal(authPayload)
	if err != nil {
		return "", fmt.Errorf("failed to prepare auth request: %w", err)
	}

	authURL := fmt.Sprintf("%s/api/v1/auth/register", s.authServiceURL)
	req, err := http.NewRequestWithContext(ctx, "POST", authURL, bytes.NewBuffer(authBody))
	if err != nil {
		return "", fmt.Errorf("failed to create auth request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if tenantCode != "" {
		req.Header.Set("X-Tenant-Code", tenantCode)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to connect to auth service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("auth service error: status %d", resp.StatusCode)
	}

	var authResp struct {
		Data struct {
			UserID string `json:"user_id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return "", fmt.Errorf("failed to parse auth response: %w", err)
	}

	return authResp.Data.UserID, nil
}

func (s *StudentService) SyncUserToTenant(ctx context.Context, db DB, userID, email, firstName, lastName, role, schoolID string) error {
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
	_, err := db.Exec(ctx, query, userID, email, firstName, lastName, role, nil, database.StatusActive, schoolID)
	return err
}

func (s *StudentService) CreateStudent(ctx context.Context, db DB, student *database.Student) (int64, string, error) {
	studentIDNumber, err := s.GenerateStudentID(ctx, db)
	if err != nil {
		return 0, "", err
	}

	query := `
		INSERT INTO students (
			school_id, user_id, first_name, last_name, email, 
			roll_number, class, admission_date, date_of_birth, status, created_at, updated_at,
			student_id_number
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
		RETURNING id
	`

	var dob *time.Time
	if student.DateOfBirth != nil {
		dob = student.DateOfBirth
	}

	var studentID int64
	err = db.QueryRow(ctx, query,
		student.SchoolID, student.UserID, student.FirstName, student.LastName, student.Email,
		studentIDNumber, // roll_number
		student.Class,
		time.Now(), // admission_date
		dob, database.StatusActive,
		studentIDNumber,
	).Scan(&studentID)

	if err != nil {
		return 0, "", err
	}

	return studentID, studentIDNumber, nil
}

func (s *StudentService) UpdateStudent(ctx context.Context, db DB, studentID string, updateFields []string, args []interface{}) (int64, error) {
	if len(updateFields) == 0 {
		return 0, fmt.Errorf("no fields to update")
	}

	// Double check: the handler appends studentID as the last arg.
	// So argPos for WHERE id = $argPos should be len(args)
	argPos := len(args)
	query := fmt.Sprintf(
		"UPDATE students SET %s WHERE id = $%d RETURNING id",
		strings.Join(updateFields, ", "),
		argPos,
	)

	var updatedID int64
	err := db.QueryRow(ctx, query, args...).Scan(&updatedID)
	if err != nil {
		return 0, err
	}

	return updatedID, nil
}

func (s *StudentService) DeleteStudent(ctx context.Context, db DB, id string) error {
	// Simple placeholder for now as the handler was just returning a message
	_, err := db.Exec(ctx, "DELETE FROM students WHERE id = $1", id)
	return err
}

func (s *StudentService) GetStudentEnrollments(ctx context.Context, db DB, studentID string) ([]map[string]interface{}, error) {
	// Placeholder
	return []map[string]interface{}{}, nil
}

func (s *StudentService) EnrollStudent(ctx context.Context, db DB, enrollment map[string]interface{}) error {
	// Placeholder
	return nil
}

func (s *StudentService) RemoveEnrollment(ctx context.Context, db DB, id string) error {
	// Placeholder
	return nil
}

func (s *StudentService) GetStudentDetails(ctx context.Context, db DB, studentID string) (*database.StudentDetails, error) {
	var student database.Student
	query := `
		SELECT id, school_id, user_id, first_name, last_name, date_of_birth, 
		       gender, nationality, student_id_number, roll_number, class, section,
		       enrollment_date, admission_date, blood_group, photo_url, email, phone,
		       address, notes, status, created_at, updated_at
		FROM students WHERE id = $1
	`
	err := db.QueryRow(ctx, query, studentID).Scan(
		&student.ID, &student.SchoolID, &student.UserID, &student.FirstName,
		&student.LastName, &student.DateOfBirth, &student.Gender, &student.Nationality,
		&student.StudentIDNumber, &student.RollNumber, &student.Class, &student.Section,
		&student.EnrollmentDate, &student.AdmissionDate, &student.BloodGroup, &student.PhotoURL,
		&student.Email, &student.Phone, &student.Address, &student.Notes, &student.Status,
		&student.CreatedAt, &student.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	details := &database.StudentDetails{Student: student}
	// Fetch sub-details sequentially for stability and easier testing
	// The primary N+1 problem is already solved by using single queries for each detail type

	// Guardians
	guardians, err := s.getStudentGuardians(ctx, db, studentID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch guardians: %w", err)
	}
	details.Guardians = guardians

	// Emergency Contacts
	contacts, err := s.getEmergencyContacts(ctx, studentID, db)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch emergency contacts: %w", err)
	}
	details.EmergencyContacts = contacts

	// Performance
	performance, _ := s.getCurrentPerformance(ctx, studentID, db)
	details.CurrentPerformance = performance

	// Attendance
	attendance, _ := s.getAttendanceSummary(ctx, studentID, db)
	details.AttendanceSummary = attendance

	// Fees
	fees, _ := s.getFeeSummary(ctx, studentID, db)
	details.FeeSummary = fees

	// Activities
	activities, _ := s.getRecentActivities(ctx, studentID, 10, db)
	details.RecentActivities = activities

	return details, nil
}

func (s *StudentService) getStudentGuardians(ctx context.Context, db DB, studentID string) ([]database.StudentGuardian, error) {
	query := `SELECT id, student_id, guardian_type, name, relationship, phone, email, occupation, address, is_primary, created_at, updated_at FROM student_guardians WHERE student_id = $1 ORDER BY is_primary DESC`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var guardians []database.StudentGuardian
	for rows.Next() {
		var g database.StudentGuardian
		if err := rows.Scan(&g.ID, &g.StudentID, &g.GuardianType, &g.Name, &g.Relationship, &g.Phone, &g.Email, &g.Occupation, &g.Address, &g.IsPrimary, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan guardian: %w", err)
		}
		guardians = append(guardians, g)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after scanning guardians: %w", err)
	}

	return guardians, nil
}

func (s *StudentService) getEmergencyContacts(ctx context.Context, studentID string, db DB) ([]database.EmergencyContact, error) {
	query := `SELECT id, student_id, name, relationship, phone, alternate_phone, address, priority, created_at, updated_at FROM emergency_contacts WHERE student_id = $1 ORDER BY priority ASC`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var contacts []database.EmergencyContact
	for rows.Next() {
		var c database.EmergencyContact
		if err := rows.Scan(&c.ID, &c.StudentID, &c.Name, &c.Relationship, &c.Phone, &c.AlternatePhone, &c.Address, &c.Priority, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan emergency contact: %w", err)
		}
		contacts = append(contacts, c)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after scanning emergency contacts: %w", err)
	}

	return contacts, nil
}

func (s *StudentService) getCurrentPerformance(ctx context.Context, studentID string, db DB) (*database.AcademicPerformance, error) {
	var p database.AcademicPerformance
	query := `SELECT id, student_id, academic_year, term, gpa, percentage, rank, total_students, remarks, created_at, updated_at FROM academic_performance WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`
	err := db.QueryRow(ctx, query, studentID).Scan(&p.ID, &p.StudentID, &p.AcademicYear, &p.Term, &p.GPA, &p.Percentage, &p.Rank, &p.TotalStudents, &p.Remarks, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *StudentService) getAttendanceSummary(ctx context.Context, studentID string, db DB) (*database.AttendanceSummary, error) {
	var sum database.AttendanceSummary
	query := `SELECT id, student_id, academic_year, month, total_days, present_days, absent_days, late_days, excused_days, attendance_percentage, created_at, updated_at FROM attendance_summary WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`
	err := db.QueryRow(ctx, query, studentID).Scan(&sum.ID, &sum.StudentID, &sum.AcademicYear, &sum.Month, &sum.TotalDays, &sum.PresentDays, &sum.AbsentDays, &sum.LateDays, &sum.ExcusedDays, &sum.AttendancePercentage, &sum.CreatedAt, &sum.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &sum, nil
}

func (s *StudentService) getFeeSummary(ctx context.Context, studentID string, db DB) (*database.FeeSummary, error) {
	var sum database.FeeSummary
	query := `SELECT id, student_id, academic_year, total_fee, paid_amount, outstanding_amount, last_payment_date, created_at, updated_at FROM fee_summary WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`
	err := db.QueryRow(ctx, query, studentID).Scan(&sum.ID, &sum.StudentID, &sum.AcademicYear, &sum.TotalFee, &sum.PaidAmount, &sum.OutstandingAmount, &sum.LastPaymentDate, &sum.CreatedAt, &sum.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &sum, nil
}

func (s *StudentService) getRecentActivities(ctx context.Context, studentID string, limit int, db DB) ([]database.StudentActivity, error) {
	query := `SELECT id, student_id, activity_type, title, description, metadata, performed_by, activity_date, created_at FROM student_activities WHERE student_id = $1 ORDER BY activity_date DESC LIMIT $2`
	rows, err := db.Query(ctx, query, studentID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var acts []database.StudentActivity
	for rows.Next() {
		var a database.StudentActivity
		if err := rows.Scan(&a.ID, &a.StudentID, &a.ActivityType, &a.Title, &a.Description, &a.Metadata, &a.PerformedBy, &a.ActivityDate, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan activity: %w", err)
		}
		acts = append(acts, a)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after scanning activities: %w", err)
	}

	return acts, nil
}

func (s *StudentService) GetStudentStatistics(ctx context.Context, db DB, studentID string) (*database.StudentStatistics, error) {
	stats := &database.StudentStatistics{StudentID: 0}

	// Overall attendance
	query := `SELECT COALESCE(AVG(attendance_percentage), 0) FROM attendance_summary WHERE student_id = $1`
	if err := db.QueryRow(ctx, query, studentID).Scan(&stats.OverallAttendance); err != nil {
		return nil, fmt.Errorf("stats: failed to scan attendance: %w", err)
	}

	// GPA
	query = `SELECT COALESCE(gpa, 0), COALESCE(percentage, 0) FROM academic_performance WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`
	if err := db.QueryRow(ctx, query, studentID).Scan(&stats.CurrentGPA, &stats.CurrentPercentage); err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("stats: failed to scan gpa: %w", err)
	}

	// Fees
	query = `SELECT COALESCE(paid_amount, 0), COALESCE(outstanding_amount, 0) FROM fee_summary WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`
	if err := db.QueryRow(ctx, query, studentID).Scan(&stats.TotalFeesPaid, &stats.OutstandingFees); err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("stats: failed to scan fees: %w", err)
	}

	// Behavior
	query = `SELECT COALESCE(SUM(points), 0) FROM behavioral_records WHERE student_id = $1`
	if err := db.QueryRow(ctx, query, studentID).Scan(&stats.BehaviorPoints); err != nil {
		return nil, fmt.Errorf("stats: failed to scan behavior: %w", err)
	}

	// Absences
	query = `SELECT COALESCE(SUM(absent_days), 0), COALESCE(SUM(late_days), 0) FROM attendance_summary WHERE student_id = $1`
	if err := db.QueryRow(ctx, query, studentID).Scan(&stats.TotalAbsences, &stats.TotalLateDays); err != nil {
		return nil, fmt.Errorf("stats: failed to scan absences: %w", err)
	}

	// Counts
	if err := db.QueryRow(ctx, "SELECT COUNT(*) FROM student_documents WHERE student_id = $1", studentID).Scan(&stats.DocumentsCount); err != nil {
		return nil, fmt.Errorf("stats: failed to scan documents count: %w", err)
	}
	if err := db.QueryRow(ctx, "SELECT COUNT(*) FROM health_records WHERE student_id = $1", studentID).Scan(&stats.HealthRecordsCount); err != nil {
		return nil, fmt.Errorf("stats: failed to scan health records count: %w", err)
	}

	return stats, nil
}

func (s *StudentService) GetStudentAcademics(ctx context.Context, db DB, studentID string) ([]database.AcademicRecord, []database.AcademicPerformance, error) {
	// 1. Get academic records
	query := `
		SELECT id, student_id, academic_year, term, subject, marks_obtained,
		       total_marks, grade, percentage, remarks, teacher_id, created_at, updated_at
		FROM academic_records
		WHERE student_id = $1
		ORDER BY academic_year DESC, term DESC, subject ASC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var records []database.AcademicRecord
	for rows.Next() {
		var r database.AcademicRecord
		if err := rows.Scan(&r.ID, &r.StudentID, &r.AcademicYear, &r.Term,
			&r.Subject, &r.MarksObtained, &r.TotalMarks, &r.Grade,
			&r.Percentage, &r.Remarks, &r.TeacherID, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, nil, fmt.Errorf("failed to scan academic record: %w", err)
		}
		records = append(records, r)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}

	// 2. Get performance history
	query = `
		SELECT id, student_id, academic_year, term, gpa, percentage, rank,
		       total_students, remarks, created_at, updated_at
		FROM academic_performance
		WHERE student_id = $1
		ORDER BY academic_year DESC, term DESC
	`
	rows, err = db.Query(ctx, query, studentID)
	if err != nil {
		return records, nil, err
	}
	defer rows.Close()

	var performance []database.AcademicPerformance
	for rows.Next() {
		var p database.AcademicPerformance
		if err := rows.Scan(&p.ID, &p.StudentID, &p.AcademicYear, &p.Term, &p.GPA,
			&p.Percentage, &p.Rank, &p.TotalStudents, &p.Remarks,
			&p.CreatedAt, &p.UpdatedAt); err != nil {
			return records, nil, fmt.Errorf("failed to scan performance: %w", err)
		}
		performance = append(performance, p)
	}
	if err := rows.Err(); err != nil {
		return records, nil, err
	}

	return records, performance, nil
}

func (s *StudentService) GetStudentAttendance(ctx context.Context, db DB, studentID string) ([]database.AttendanceRecord, []database.AttendanceSummary, error) {
	// Last 90 days of records
	query := `
		SELECT id, student_id, date, status, check_in_time, check_out_time,
		       reason, marked_by, created_at, updated_at
		FROM attendance_records
		WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '90 days'
		ORDER BY date DESC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var records []database.AttendanceRecord
	for rows.Next() {
		var r database.AttendanceRecord
		if err := rows.Scan(&r.ID, &r.StudentID, &r.Date, &r.Status,
			&r.CheckInTime, &r.CheckOutTime, &r.Reason, &r.MarkedBy,
			&r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, nil, fmt.Errorf("failed to scan attendance record: %w", err)
		}
		records = append(records, r)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}

	// Monthly summaries
	query = `
		SELECT id, student_id, academic_year, month, total_days, present_days,
		       absent_days, late_days, excused_days, attendance_percentage,
		       created_at, updated_at
		FROM attendance_summary
		WHERE student_id = $1
		ORDER BY academic_year DESC, month DESC
		LIMIT 12
	`
	rows, err = db.Query(ctx, query, studentID)
	if err != nil {
		return records, nil, err
	}
	defer rows.Close()

	var summaries []database.AttendanceSummary
	for rows.Next() {
		var sum database.AttendanceSummary
		if err := rows.Scan(&sum.ID, &sum.StudentID, &sum.AcademicYear, &sum.Month,
			&sum.TotalDays, &sum.PresentDays, &sum.AbsentDays, &sum.LateDays,
			&sum.ExcusedDays, &sum.AttendancePercentage, &sum.CreatedAt, &sum.UpdatedAt); err != nil {
			return records, nil, fmt.Errorf("failed to scan attendance summary: %w", err)
		}
		summaries = append(summaries, sum)
	}
	if err := rows.Err(); err != nil {
		return records, nil, err
	}

	return records, summaries, nil
}

func (s *StudentService) GetStudentFees(ctx context.Context, db DB, studentID string) ([]database.FeePayment, []database.FeeSummary, error) {
	// Get fee payments
	query := `
		SELECT id, student_id, academic_year, fee_type, amount_paid, payment_date,
		       payment_method, transaction_id, receipt_number, remarks, received_by,
		       created_at, updated_at
		FROM fee_payments
		WHERE student_id = $1
		ORDER BY payment_date DESC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var payments []database.FeePayment
	for rows.Next() {
		var p database.FeePayment
		if err := rows.Scan(&p.ID, &p.StudentID, &p.AcademicYear, &p.FeeType,
			&p.AmountPaid, &p.PaymentDate, &p.PaymentMethod, &p.TransactionID,
			&p.ReceiptNumber, &p.Remarks, &p.ReceivedBy, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, nil, fmt.Errorf("failed to scan payment: %w", err)
		}
		payments = append(payments, p)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}

	// Get summaries
	query = `
		SELECT id, student_id, academic_year, total_fee, paid_amount, outstanding_amount,
		       last_payment_date, created_at, updated_at
		FROM fee_summary
		WHERE student_id = $1
		ORDER BY academic_year DESC
	`
	rows, err = db.Query(ctx, query, studentID)
	if err != nil {
		return payments, nil, err
	}
	defer rows.Close()

	var summaries []database.FeeSummary
	for rows.Next() {
		var sum database.FeeSummary
		if err := rows.Scan(&sum.ID, &sum.StudentID, &sum.AcademicYear, &sum.TotalFee,
			&sum.PaidAmount, &sum.OutstandingAmount, &sum.LastPaymentDate,
			&sum.CreatedAt, &sum.UpdatedAt); err != nil {
			return payments, nil, fmt.Errorf("failed to scan fee summary: %w", err)
		}
		summaries = append(summaries, sum)
	}
	if err := rows.Err(); err != nil {
		return payments, nil, err
	}

	return payments, summaries, nil
}

func (s *StudentService) GetStudentHealth(ctx context.Context, db DB, studentID string) ([]database.HealthRecord, error) {
	query := `
		SELECT id, student_id, record_type, title, description, severity,
		       diagnosed_date, doctor_name, hospital, prescription, notes,
		       created_at, updated_at
		FROM health_records
		WHERE student_id = $1
		ORDER BY created_at DESC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []database.HealthRecord
	for rows.Next() {
		var r database.HealthRecord
		if err := rows.Scan(&r.ID, &r.StudentID, &r.RecordType, &r.Title,
			&r.Description, &r.Severity, &r.DiagnosedDate, &r.DoctorName,
			&r.Hospital, &r.Prescription, &r.Notes, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan health record: %w", err)
		}
		records = append(records, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return records, nil
}

func (s *StudentService) GetStudentBehavioral(ctx context.Context, db DB, studentID string) ([]database.BehavioralRecord, error) {
	query := `
		SELECT id, student_id, record_type, category, title, description,
		       incident_date, action_taken, reported_by, severity, points,
		       created_at, updated_at
		FROM behavioral_records
		WHERE student_id = $1
		ORDER BY incident_date DESC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []database.BehavioralRecord
	for rows.Next() {
		var r database.BehavioralRecord
		if err := rows.Scan(&r.ID, &r.StudentID, &r.RecordType, &r.Category,
			&r.Title, &r.Description, &r.IncidentDate, &r.ActionTaken,
			&r.ReportedBy, &r.Severity, &r.Points, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan behavioral record: %w", err)
		}
		records = append(records, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return records, nil
}

func (s *StudentService) GetStudentDocuments(ctx context.Context, db DB, studentID string) ([]database.StudentDocument, error) {
	query := `
		SELECT id, student_id, document_type, title, file_name, file_path,
		       file_size, mime_type, is_verified, verified_by, verified_at,
		       uploaded_by, created_at, updated_at
		FROM student_documents
		WHERE student_id = $1
		ORDER BY created_at DESC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []database.StudentDocument
	for rows.Next() {
		var d database.StudentDocument
		if err := rows.Scan(&d.ID, &d.StudentID, &d.DocumentType, &d.Title, &d.FileName,
			&d.FilePath, &d.FileSize, &d.MimeType, &d.IsVerified, &d.VerifiedBy,
			&d.VerifiedAt, &d.UploadedBy, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan document: %w", err)
		}
		docs = append(docs, d)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return docs, nil
}

func (s *StudentService) GetStudentCommunications(ctx context.Context, db DB, studentID string) ([]database.ParentCommunication, error) {
	query := `
		SELECT id, student_id, communication_type, subject, message,
		       communication_date, initiated_by, teacher_id, parent_id,
		       status, notes, created_at, updated_at
		FROM parent_communications
		WHERE student_id = $1
		ORDER BY communication_date DESC
	`
	rows, err := db.Query(ctx, query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comms []database.ParentCommunication
	for rows.Next() {
		var c database.ParentCommunication
		if err := rows.Scan(&c.ID, &c.StudentID, &c.CommunicationType, &c.Subject,
			&c.Message, &c.CommunicationDate, &c.InitiatedBy, &c.TeacherID,
			&c.ParentID, &c.Status, &c.Notes, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan communication: %w", err)
		}
		comms = append(comms, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return comms, nil
}

func (s *StudentService) GenerateStudentID(ctx context.Context, db DB) (string, error) {
	year := time.Now().Year()
	prefix := fmt.Sprintf("STU-%d", year)

	query := `SELECT roll_number FROM students WHERE roll_number LIKE $1 ORDER BY id DESC LIMIT 1`

	var lastID string
	err := db.QueryRow(ctx, query, prefix+"%").Scan(&lastID)

	if err != nil {
		return fmt.Sprintf("%s-0001", prefix), nil
	}

	var sequence int
	_, err = fmt.Sscanf(lastID, prefix+"-%d", &sequence)
	if err != nil {
		return fmt.Sprintf("%s-0001", prefix), nil
	}

	return fmt.Sprintf("%s-%04d", prefix, sequence+1), nil
}
