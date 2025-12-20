package database

import "time"

type Class struct {
	ID           int64     `json:"id"`
	SchoolID     string    `json:"school_id"`
	Name         string    `json:"name"`    // e.g., Class 10-A
	Grade        string    `json:"grade"`   // e.g., 10
	Section      string    `json:"section"` // e.g., A
	Capacity     int       `json:"capacity"`
	TeacherID    int64     `json:"teacher_id"`   // Reference to teacher user id
	TeacherName  string    `json:"teacher_name"` // For denormalized display
	Room         string    `json:"room"`
	Shift        string    `json:"shift"` // Morning, Afternoon, Evening
	AcademicYear string    `json:"academic_year"`
	Description  string    `json:"description"`
	Status       string    `json:"status"` // Active, Inactive
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type AcademicYear struct {
	ID          string    `json:"id" db:"id"`
	SchoolID    string    `json:"school_id" db:"school_id"`
	Name        string    `json:"name" db:"name"`
	StartDate   string    `json:"start_date" db:"start_date"`
	EndDate     string    `json:"end_date" db:"end_date"`
	Status      string    `json:"status" db:"status"` // Active, Inactive
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	IsCurrent   bool      `json:"is_current" db:"is_current"`
}
