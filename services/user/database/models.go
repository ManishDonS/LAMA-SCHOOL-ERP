package database

import "time"

// Teacher represents a teacher user
type Teacher struct {
	ID             int64      `json:"id"`
	SchoolID       string     `json:"school_id"`
	UserID         string     `json:"user_id"`
	Qualification  string     `json:"qualification"`
	Department     string     `json:"department"`
	EmployeeID     string     `json:"employee_id"`
	Phone          string     `json:"phone"`
	DateOfBirth    *time.Time `json:"date_of_birth"`
	Gender         string     `json:"gender"`
	Specialization string     `json:"specialization"`
	Experience     float64    `json:"experience"`
	EmploymentType string     `json:"employment_type"`
	Salary         float64    `json:"salary"`
	Address        string     `json:"address"`
	City           string     `json:"city"`
	State          string     `json:"state"`
	Subject        string     `json:"subject"`
	ClassAssigned  string     `json:"class_assigned"`
	JoinDate       time.Time  `json:"join_date"`
	Status         string     `json:"status"` // active, inactive, on_leave
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	// Joined fields from users table
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

// Parent represents a parent/guardian user
type Parent struct {
	ID                      int64      `json:"id"`
	SchoolID                string     `json:"school_id"`
	UserID                  string     `json:"user_id"`
	GuardianID              string     `json:"guardian_id"`
	PhoneNumber             string     `json:"phone_number"`
	AlternatePhone          string     `json:"alternate_phone"`
	Relationship            string     `json:"relationship"`
	DateOfBirth             *time.Time `json:"date_of_birth"`
	Gender                  string     `json:"gender"`
	MaritalStatus           string     `json:"marital_status"`
	Occupation              string     `json:"occupation"`
	Company                 string     `json:"company"`
	Income                  float64    `json:"income"`
	Address                 string     `json:"address"`
	City                    string     `json:"city"`
	State                   string     `json:"state"`
	ZipCode                 string     `json:"zip_code"`
	CommunicationPreference string     `json:"communication_preference"`
	EmergencyContactName    string     `json:"emergency_contact_name"`
	EmergencyContactPhone   string     `json:"emergency_contact_phone"`
	EmergencyRelationship   string     `json:"emergency_relationship"`
	Status                  string     `json:"status"`
	Notes                   string     `json:"notes"`
	LinkedStudents          []string   `json:"linked_students"`
	CreatedAt               time.Time  `json:"created_at"`
	UpdatedAt               time.Time  `json:"updated_at"`

	// Joined fields from users table
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

// Staff represents a staff user
type Staff struct {
	ID            int64     `json:"id"`
	SchoolID      string    `json:"school_id"`
	UserID        string    `json:"user_id"`
	Department    string    `json:"department"`
	Position      string    `json:"position"`
	EmployeeID    string    `json:"employee_id"`
	Phone         string    `json:"phone"`
	Address       string    `json:"address"`
	City          string    `json:"city"`
	State         string    `json:"state"`
	ZipCode       string    `json:"zip_code"`
	Qualification string    `json:"qualification"`
	Experience    float64   `json:"experience"`
	Salary        float64   `json:"salary"`
	Notes         string    `json:"notes"`
	JoinDate      time.Time `json:"join_date"`
	Status        string    `json:"status"` // active, inactive, on_leave
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Joined fields from users table
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

// Department represents a school department
type Department struct {
	ID               int64     `json:"id"`
	SchoolID         string    `json:"school_id"`
	Name             string    `json:"name"`
	Code             string    `json:"code"`
	Description      string    `json:"description"`
	HeadOfDepartment string    `json:"head_of_department"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
