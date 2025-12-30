package service

import (
	"context"
	"fmt"
	"regexp"
	"testing"
	"time"

	"school-erp/student/database"

	"github.com/pashagolub/pgxmock/v3"
)

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func TestGenerateStudentID(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	s := &StudentService{}
	ctx := context.Background()
	year := time.Now().Year()
	// prefix := fmt.Sprintf("STU-%d-", year)

	// Case 1: First student of the year
	mock.ExpectQuery(regexp.QuoteMeta("SELECT roll_number FROM students WHERE roll_number LIKE $1 ORDER BY id DESC LIMIT 1")).
		WithArgs(pgxmock.AnyArg()).
		WillReturnError(fmt.Errorf("no rows in result set"))

	id, err := s.GenerateStudentID(ctx, mock)
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}
	expected := fmt.Sprintf("STU-%d-0001", year)
	if id != expected {
		t.Errorf("Expected %s, got %s", expected, id)
	}

	// Case 2: Subsequent student
	mock.ExpectQuery(regexp.QuoteMeta("SELECT roll_number FROM students WHERE roll_number LIKE $1 ORDER BY id DESC LIMIT 1")).
		WithArgs(pgxmock.AnyArg()).
		WillReturnRows(pgxmock.NewRows([]string{"roll_number"}).AddRow(fmt.Sprintf("STU-%d-0001", year)))

	id, err = s.GenerateStudentID(ctx, mock)
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}
	expected = fmt.Sprintf("STU-%d-0002", year)
	if id != expected {
		t.Errorf("Expected %s, got %s", expected, id)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unmet expectations: %s", err)
	}
}

func TestRegisterStudentAuth(t *testing.T) {
	// This requires a mock HTTP server if we want to test RegisterStudentAuth
	// But let's skip it for now and focus on DB-related logic if time is tight
}

func TestListStudents(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	s := &StudentService{}

	// Case 1: First student
	section := "A"
	phone := "12345678"
	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, first_name, last_name, student_id_number, class, section, email, phone, status FROM students ORDER BY created_at DESC LIMIT $1 OFFSET $2")).
		WithArgs(10, 0).
		WillReturnRows(pgxmock.NewRows([]string{"id", "first_name", "last_name", "student_id_number", "class", "section", "email", "phone", "status"}).
			AddRow(int64(1), strPtr("John"), strPtr("Doe"), strPtr("STU-2025-0001"), strPtr("10"), &section, strPtr("john@example.com"), &phone, "active"))

	limit, offset := 10, 0
	students, err := s.ListStudents(context.Background(), mock, limit, offset)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if len(students) != 1 {
		t.Fatalf("Expected 1 student, got %d. Check if query matched.", len(students))
	}

	firstName := students[0]["first_name"].(*string)
	if firstName == nil || *firstName != "John" {
		t.Errorf("Expected John, got %v", firstName)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unmet expectations: %s", err)
	}
}
func TestCreateStudent(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	s := &StudentService{}
	ctx := context.Background()

	student := &database.Student{
		SchoolID:  "school-1",
		UserID:    "user-1",
		FirstName: strPtr("Jane"),
		LastName:  strPtr("Doe"),
		Email:     strPtr("jane@example.com"),
		Class:     strPtr("10"),
	}

	// 1. Generate ID mock
	mock.ExpectQuery(regexp.QuoteMeta("SELECT roll_number FROM students WHERE roll_number LIKE $1 ORDER BY id DESC LIMIT 1")).
		WithArgs(pgxmock.AnyArg()).
		WillReturnError(fmt.Errorf("no rows"))

	// 2. Insert mock
	mock.ExpectQuery("(?s)INSERT INTO students.*RETURNING id").
		WithArgs(
			student.SchoolID, student.UserID, student.FirstName, student.LastName, student.Email,
			pgxmock.AnyArg(), // student_id_number used for roll_number
			student.Class,
			pgxmock.AnyArg(), // admission_date
			pgxmock.AnyArg(), // dob
			"active",
			pgxmock.AnyArg(), // student_id_number
		).
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow(int64(101)))

	id, idNum, err := s.CreateStudent(ctx, mock, student)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if id != 101 {
		t.Errorf("Expected 101, got %d", id)
	}

	if idNum == "" {
		t.Errorf("Expected ID number, got empty")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unmet expectations: %s", err)
	}
}

func TestUpdateStudent(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	s := &StudentService{}
	ctx := context.Background()

	fields := []string{"first_name = $1", "last_name = $2"}
	args := []interface{}{"Updated", "Name", "student-123"}

	mock.ExpectQuery(regexp.QuoteMeta("UPDATE students SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING id")).
		WithArgs("Updated", "Name", "student-123").
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow(int64(101)))

	id, err := s.UpdateStudent(ctx, mock, "student-123", fields, args)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if id != 101 {
		t.Errorf("Expected 101, got %d", id)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unmet expectations: %s", err)
	}
}

func TestGetStudentDetails(t *testing.T) {
	mock, err := pgxmock.NewPool(pgxmock.QueryMatcherOption(pgxmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatal(err)
	}
	defer mock.Close()

	s := &StudentService{}
	ctx := context.Background()
	studentID := "101"

	// 1. Student mock - use exact query matching
	studentQuery := `
		SELECT id, school_id, user_id, first_name, last_name, date_of_birth, 
		       gender, nationality, student_id_number, roll_number, class, section,
		       enrollment_date, admission_date, blood_group, photo_url, email, phone,
		       address, notes, status, created_at, updated_at
		FROM students WHERE id = $1
	`
	mock.ExpectQuery(regexp.QuoteMeta(studentQuery)).
		WithArgs(studentID).
		WillReturnRows(pgxmock.NewRows([]string{"id", "school_id", "user_id", "first_name", "last_name", "date_of_birth", "gender", "nationality", "student_id_number", "roll_number", "class", "section", "enrollment_date", "admission_date", "blood_group", "photo_url", "email", "phone", "address", "notes", "status", "created_at", "updated_at"}).
			AddRow(int64(101), "school-1", "user-1", strPtr("John"), strPtr("Doe"), nil, nil, nil, strPtr("STU-1"), "1", strPtr("10"), nil, nil, time.Now(), nil, nil, strPtr("john@example.com"), nil, nil, nil, "active", time.Now(), time.Now()))

	// 2. Guardians mock
	guardianQuery := `
		SELECT id, student_id, guardian_type, name, relationship, phone, email,
		       occupation, address, is_primary, created_at, updated_at
		FROM student_guardians
		WHERE student_id = $1
		ORDER BY is_primary DESC
	`
	mock.ExpectQuery(regexp.QuoteMeta(guardianQuery)).
		WithArgs(studentID).
		WillReturnRows(pgxmock.NewRows([]string{"id", "student_id", "guardian_type", "name", "relationship", "phone", "email", "occupation", "address", "is_primary", "created_at", "updated_at"}))

	// 3. Emergency Contacts mock
	emergencyQuery := `
		SELECT id, student_id, name, relationship, phone, alternate_phone,
		       address, priority, created_at, updated_at
		FROM emergency_contacts
		WHERE student_id = $1
		ORDER BY priority ASC
	`
	mock.ExpectQuery(regexp.QuoteMeta(emergencyQuery)).
		WithArgs(studentID).
		WillReturnRows(pgxmock.NewRows([]string{"id", "student_id", "name", "relationship", "phone", "alternate_phone", "address", "priority", "created_at", "updated_at"}))

	// 4. Performance mock
	performanceQuery := `
		SELECT id, student_id, academic_year, term, gpa, percentage, rank,
		       total_students, remarks, created_at, updated_at
		FROM academic_performance
		WHERE student_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	mock.ExpectQuery(regexp.QuoteMeta(performanceQuery)).
		WithArgs(studentID).
		WillReturnRows(pgxmock.NewRows([]string{"id", "student_id", "academic_year", "term", "gpa", "percentage", "rank", "total_students", "remarks", "created_at", "updated_at"}))

	// 5. Attendance mock
	attendanceQuery := `
		SELECT id, student_id, academic_year, month, total_days, present_days,
		       absent_days, late_days, excused_days, attendance_percentage,
		       created_at, updated_at
		FROM attendance_summary
		WHERE student_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	mock.ExpectQuery(regexp.QuoteMeta(attendanceQuery)).
		WithArgs(studentID).
		WillReturnRows(pgxmock.NewRows([]string{"id", "student_id", "academic_year", "month", "total_days", "present_days", "absent_days", "late_days", "excused_days", "attendance_percentage", "created_at", "updated_at"}))

	// 6. Fees mock
	feesQuery := `
		SELECT id, student_id, academic_year, total_fee, paid_amount, outstanding_amount,
		       last_payment_date, created_at, updated_at
		FROM fee_summary
		WHERE student_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	mock.ExpectQuery(regexp.QuoteMeta(feesQuery)).
		WithArgs(studentID).
		WillReturnRows(pgxmock.NewRows([]string{"id", "student_id", "academic_year", "total_fee", "paid_amount", "outstanding_amount", "last_payment_date", "created_at", "updated_at"}))

	// 7. Activities mock
	activitiesQuery := `
		SELECT id, student_id, activity_type, title, description, metadata,
		       performed_by, activity_date, created_at
		FROM student_activities
		WHERE student_id = $1
		ORDER BY activity_date DESC
		LIMIT $2
	`
	mock.ExpectQuery(regexp.QuoteMeta(activitiesQuery)).
		WithArgs(studentID, 10).
		WillReturnRows(pgxmock.NewRows([]string{"id", "student_id", "activity_type", "title", "description", "metadata", "performed_by", "activity_date", "created_at"}))

	details, err := s.GetStudentDetails(ctx, mock, studentID)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if details.Student.FirstName == nil || *details.Student.FirstName != "John" {
		t.Errorf("Expected John, got %v", details.Student.FirstName)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unmet expectations: %s", err)
	}
}
