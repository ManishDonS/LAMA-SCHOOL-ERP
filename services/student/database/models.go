package database

import "time"

type Student struct {
	ID              int64      `json:"id"`
	SchoolID        string     `json:"school_id"`
	UserID          string     `json:"user_id"`
	FirstName       *string    `json:"first_name"`
	LastName        *string    `json:"last_name"`
	DateOfBirth     *time.Time `json:"date_of_birth"`
	Gender          *string    `json:"gender"`
	Nationality     *string    `json:"nationality"`
	StudentIDNumber *string    `json:"student_id_number"`
	RollNumber      string     `json:"roll_number"`
	Class           *string    `json:"class"`
	Section         *string    `json:"section"`
	EnrollmentDate  *time.Time `json:"enrollment_date"`
	AdmissionDate   time.Time  `json:"admission_date"`
	BloodGroup      *string    `json:"blood_group"`
	PhotoURL        *string    `json:"photo_url"`
	Email           *string    `json:"email"`
	Phone           *string    `json:"phone"`
	Address         *string    `json:"address"`
	Notes           *string    `json:"notes"`
	Status          string     `json:"status"` // active, inactive, graduated
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type StudentGuardian struct {
	ID           int64     `json:"id"`
	StudentID    int64     `json:"student_id"`
	GuardianType string    `json:"guardian_type"` // father, mother, guardian
	Name         string    `json:"name"`
	Relationship string    `json:"relationship"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	Occupation   string    `json:"occupation"`
	Address      string    `json:"address"`
	IsPrimary    bool      `json:"is_primary"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type EmergencyContact struct {
	ID             int64     `json:"id"`
	StudentID      int64     `json:"student_id"`
	Name           string    `json:"name"`
	Relationship   string    `json:"relationship"`
	Phone          string    `json:"phone"`
	AlternatePhone string    `json:"alternate_phone"`
	Address        string    `json:"address"`
	Priority       int       `json:"priority"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type AcademicRecord struct {
	ID            int64     `json:"id"`
	StudentID     int64     `json:"student_id"`
	AcademicYear  string    `json:"academic_year"`
	Term          string    `json:"term"`
	Subject       string    `json:"subject"`
	MarksObtained float64   `json:"marks_obtained"`
	TotalMarks    float64   `json:"total_marks"`
	Grade         string    `json:"grade"`
	Percentage    float64   `json:"percentage"`
	Remarks       string    `json:"remarks"`
	TeacherID     *int64    `json:"teacher_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type AcademicPerformance struct {
	ID            int64     `json:"id"`
	StudentID     int64     `json:"student_id"`
	AcademicYear  string    `json:"academic_year"`
	Term          string    `json:"term"`
	GPA           float64   `json:"gpa"`
	Percentage    float64   `json:"percentage"`
	Rank          int       `json:"rank"`
	TotalStudents int       `json:"total_students"`
	Remarks       string    `json:"remarks"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type AttendanceRecord struct {
	ID           int64      `json:"id"`
	StudentID    int64      `json:"student_id"`
	Date         time.Time  `json:"date"`
	Status       string     `json:"status"` // present, absent, late, half-day, excused
	CheckInTime  *time.Time `json:"check_in_time"`
	CheckOutTime *time.Time `json:"check_out_time"`
	Reason       string     `json:"reason"`
	MarkedBy     *int64     `json:"marked_by"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type AttendanceSummary struct {
	ID                   int64     `json:"id"`
	StudentID            int64     `json:"student_id"`
	AcademicYear         string    `json:"academic_year"`
	Month                int       `json:"month"`
	TotalDays            int       `json:"total_days"`
	PresentDays          int       `json:"present_days"`
	AbsentDays           int       `json:"absent_days"`
	LateDays             int       `json:"late_days"`
	ExcusedDays          int       `json:"excused_days"`
	AttendancePercentage float64   `json:"attendance_percentage"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type FeeStructure struct {
	ID           int64      `json:"id"`
	StudentID    int64      `json:"student_id"`
	AcademicYear string     `json:"academic_year"`
	FeeType      string     `json:"fee_type"`
	Amount       float64    `json:"amount"`
	DueDate      *time.Time `json:"due_date"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type FeePayment struct {
	ID            int64     `json:"id"`
	StudentID     int64     `json:"student_id"`
	AcademicYear  string    `json:"academic_year"`
	FeeType       string    `json:"fee_type"`
	AmountPaid    float64   `json:"amount_paid"`
	PaymentDate   time.Time `json:"payment_date"`
	PaymentMethod string    `json:"payment_method"`
	TransactionID string    `json:"transaction_id"`
	ReceiptNumber string    `json:"receipt_number"`
	Remarks       string    `json:"remarks"`
	ReceivedBy    *int64    `json:"received_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type FeeSummary struct {
	ID                int64      `json:"id"`
	StudentID         int64      `json:"student_id"`
	AcademicYear      string     `json:"academic_year"`
	TotalFee          float64    `json:"total_fee"`
	PaidAmount        float64    `json:"paid_amount"`
	OutstandingAmount float64    `json:"outstanding_amount"`
	LastPaymentDate   *time.Time `json:"last_payment_date"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type HealthRecord struct {
	ID            int64      `json:"id"`
	StudentID     int64      `json:"student_id"`
	RecordType    string     `json:"record_type"` // medical_condition, allergy, medication, vaccination, checkup
	Title         string     `json:"title"`
	Description   string     `json:"description"`
	Severity      string     `json:"severity"`
	DiagnosedDate *time.Time `json:"diagnosed_date"`
	DoctorName    string     `json:"doctor_name"`
	Hospital      string     `json:"hospital"`
	Prescription  string     `json:"prescription"`
	Notes         string     `json:"notes"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type BehavioralRecord struct {
	ID           int64     `json:"id"`
	StudentID    int64     `json:"student_id"`
	RecordType   string    `json:"record_type"` // positive, negative, neutral
	Category     string    `json:"category"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	IncidentDate time.Time `json:"incident_date"`
	ActionTaken  string    `json:"action_taken"`
	ReportedBy   *int64    `json:"reported_by"`
	Severity     string    `json:"severity"`
	Points       int       `json:"points"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type StudentDocument struct {
	ID           int64      `json:"id"`
	StudentID    int64      `json:"student_id"`
	DocumentType string     `json:"document_type"`
	Title        string     `json:"title"`
	FileName     string     `json:"file_name"`
	FilePath     string     `json:"file_path"`
	FileSize     int64      `json:"file_size"`
	MimeType     string     `json:"mime_type"`
	IsVerified   bool       `json:"is_verified"`
	VerifiedBy   *int64     `json:"verified_by"`
	VerifiedAt   *time.Time `json:"verified_at"`
	UploadedBy   *int64     `json:"uploaded_by"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type ParentCommunication struct {
	ID                int64     `json:"id"`
	StudentID         int64     `json:"student_id"`
	CommunicationType string    `json:"communication_type"`
	Subject           string    `json:"subject"`
	Message           string    `json:"message"`
	CommunicationDate time.Time `json:"communication_date"`
	InitiatedBy       string    `json:"initiated_by"`
	TeacherID         *int64    `json:"teacher_id"`
	ParentID          *int64    `json:"parent_id"`
	Status            string    `json:"status"`
	Notes             string    `json:"notes"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type StudentActivity struct {
	ID           int64     `json:"id"`
	StudentID    int64     `json:"student_id"`
	ActivityType string    `json:"activity_type"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Metadata     string    `json:"metadata"` // JSON string
	PerformedBy  *int64    `json:"performed_by"`
	ActivityDate time.Time `json:"activity_date"`
	CreatedAt    time.Time `json:"created_at"`
}

type Enrollment struct {
	ID        int64     `json:"id"`
	StudentID int64     `json:"student_id"`
	ClassID   int64     `json:"class_id"`
	SchoolID  string    `json:"school_id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Comprehensive Student Details Response
type StudentDetails struct {
	Student            Student              `json:"student"`
	Guardians          []StudentGuardian    `json:"guardians"`
	EmergencyContacts  []EmergencyContact   `json:"emergency_contacts"`
	CurrentPerformance *AcademicPerformance `json:"current_performance"`
	AttendanceSummary  *AttendanceSummary   `json:"attendance_summary"`
	FeeSummary         *FeeSummary          `json:"fee_summary"`
	RecentActivities   []StudentActivity    `json:"recent_activities"`
}

// Statistics Response
type StudentStatistics struct {
	StudentID          int64   `json:"student_id"`
	OverallAttendance  float64 `json:"overall_attendance"`
	CurrentGPA         float64 `json:"current_gpa"`
	CurrentPercentage  float64 `json:"current_percentage"`
	TotalFeesPaid      float64 `json:"total_fees_paid"`
	OutstandingFees    float64 `json:"outstanding_fees"`
	BehaviorPoints     int     `json:"behavior_points"`
	TotalAbsences      int     `json:"total_absences"`
	TotalLateDays      int     `json:"total_late_days"`
	DocumentsCount     int     `json:"documents_count"`
	HealthRecordsCount int     `json:"health_records_count"`
}
