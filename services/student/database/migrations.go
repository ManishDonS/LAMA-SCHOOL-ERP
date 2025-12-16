package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{
		createStudentsTable,
		createEnrollmentsTable,
		comprehensiveStudentSchema,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(context.Background(), migration); err != nil {
			log.Printf("Error running migration: %v", err)
			return err
		}
	}

	log.Println("✓ Migrations completed")
	return nil
}

const createStudentsTable = `
CREATE TABLE IF NOT EXISTS students (
	id BIGSERIAL PRIMARY KEY,
	school_id VARCHAR(50) NOT NULL,
	user_id UUID NOT NULL UNIQUE,
	roll_number VARCHAR(50) UNIQUE NOT NULL,
	class VARCHAR(50),
	section VARCHAR(10),
	admission_date TIMESTAMP NOT NULL,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
`

const createEnrollmentsTable = `
CREATE TABLE IF NOT EXISTS enrollments (
	id BIGSERIAL PRIMARY KEY,
	student_id BIGINT NOT NULL,
	class_id BIGINT NOT NULL,
	school_id VARCHAR(50) NOT NULL,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
`

const comprehensiveStudentSchema = `
-- Extended Student Profile Fields
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id_number VARCHAR(50) UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;

-- Guardian Information
CREATE TABLE IF NOT EXISTS student_guardians (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    occupation VARCHAR(100),
    address TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(5,2),
    total_marks DECIMAL(5,2),
    grade VARCHAR(5),
    percentage DECIMAL(5,2),
    remarks TEXT,
    teacher_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year, term, subject)
);

CREATE TABLE IF NOT EXISTS academic_performance (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(50) NOT NULL,
    gpa DECIMAL(3,2),
    percentage DECIMAL(5,2),
    rank INTEGER,
    total_students INTEGER,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year, term)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    reason TEXT,
    marked_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_summary (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    month INTEGER NOT NULL,
    total_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    late_days INTEGER DEFAULT 0,
    excused_days INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year, month)
);

CREATE TABLE IF NOT EXISTS fee_payments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    fee_type VARCHAR(100) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(100) UNIQUE,
    remarks TEXT,
    received_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_summary (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    total_fee DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    outstanding_amount DECIMAL(10,2) DEFAULT 0,
    last_payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year)
);

CREATE TABLE IF NOT EXISTS health_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(20),
    diagnosed_date DATE,
    doctor_name VARCHAR(200),
    hospital VARCHAR(200),
    prescription TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS behavioral_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    action_taken TEXT,
    reported_by BIGINT,
    severity VARCHAR(20),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_documents (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    verified_by BIGINT,
    verified_at TIMESTAMP,
    uploaded_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parent_communications (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL,
    subject VARCHAR(200),
    message TEXT,
    communication_date TIMESTAMP NOT NULL,
    initiated_by VARCHAR(50),
    teacher_id BIGINT,
    parent_id BIGINT,
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_activities (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    metadata JSONB,
    performed_by BIGINT,
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id ON student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student_id ON emergency_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_student_id ON academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_year_term ON academic_records(academic_year, term);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_student_id ON attendance_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_summary_student_id ON fee_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_health_records_student_id ON health_records(student_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_records_student_id ON behavioral_records(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_communications_student_id ON parent_communications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_student_id ON student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_date ON student_activities(activity_date DESC);
`
