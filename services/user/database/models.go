package database

import "time"

// Teacher represents a teacher user
type Teacher struct {
	ID          int64     `json:"id"`
	SchoolID    int64     `json:"school_id"`
	UserID      int64     `json:"user_id"`
	Qualification string `json:"qualification"`
	Department  string    `json:"department"`
	EmployeeID  string    `json:"employee_id"`
	JoinDate    time.Time `json:"join_date"`
	Status      string    `json:"status"` // active, inactive, on_leave
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Parent represents a parent/guardian user
type Parent struct {
	ID          int64     `json:"id"`
	SchoolID    int64     `json:"school_id"`
	UserID      int64     `json:"user_id"`
	PhoneNumber string    `json:"phone_number"`
	Occupation  string    `json:"occupation"`
	Address     string    `json:"address"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Staff represents a staff user
type Staff struct {
	ID          int64     `json:"id"`
	SchoolID    int64     `json:"school_id"`
	UserID      int64     `json:"user_id"`
	Department  string    `json:"department"`
	Position    string    `json:"position"`
	EmployeeID  string    `json:"employee_id"`
	JoinDate    time.Time `json:"join_date"`
	Status      string    `json:"status"` // active, inactive
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
