package database

import "time"

type Attendance struct {
	ID        int64     `json:"id"`
	SchoolID  string    `json:"school_id"`
	StudentID int64     `json:"student_id"`
	Class     string    `json:"class"`
	Date      time.Time `json:"date"`
	Status    string    `json:"status"` // present, absent, leave
	Remarks   string    `json:"remarks"`
	MarkedBy  string    `json:"marked_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
