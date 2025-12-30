package database

import "time"

type Book struct {
	ID              string    `json:"id"`
	SchoolID        string    `json:"school_id"`
	Title           string    `json:"title"`
	Author          string    `json:"author"`
	ISBN            string    `json:"isbn"`
	Category        string    `json:"category"`
	TotalCopies     int       `json:"total_copies"`
	AvailableCopies int       `json:"available_copies"`
	QRCode          string    `json:"qr_code"`
	PublicationYear int       `json:"publication_year"`
	Description     string    `json:"description"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type BookIssue struct {
	ID         string     `json:"id"`
	SchoolID   string     `json:"school_id"`
	BookID     string     `json:"book_id"`
	StudentID  string     `json:"student_id"`
	IssueDate  time.Time  `json:"issue_date"`
	DueDate    time.Time  `json:"due_date"`
	ReturnDate *time.Time `json:"return_date,omitempty"`
	Status     string     `json:"status"` // Issued, Returned, Overdue
	Fine       float64    `json:"fine"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type BookBooking struct {
	ID          string    `json:"id"`
	SchoolID    string    `json:"school_id"`
	BookID      string    `json:"book_id"`
	StudentID   string    `json:"student_id"`
	BookingDate time.Time `json:"booking_date"`
	Priority    string    `json:"priority"` // Low, Medium, High
	Status      string    `json:"status"`   // Pending, Approved, Issued, Cancelled
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
