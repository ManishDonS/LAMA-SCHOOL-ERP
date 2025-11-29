package database

import "time"

type Student struct {
	ID           int64     `json:"id"`
	SchoolID     int64     `json:"school_id"`
	UserID       int64     `json:"user_id"`
	RollNumber   string    `json:"roll_number"`
	Class        string    `json:"class"`
	Section      string    `json:"section"`
	AdmissionDate time.Time `json:"admission_date"`
	Status       string    `json:"status"` // active, inactive, graduated
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Enrollment struct {
	ID        int64     `json:"id"`
	StudentID int64     `json:"student_id"`
	ClassID   int64     `json:"class_id"`
	SchoolID  int64     `json:"school_id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
