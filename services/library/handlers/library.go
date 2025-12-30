package handlers

import (
	"context"
	"fmt"
	"math"
	"time"

	"school-erp/library/database"
	"school-erp/library/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Helper to get tenant DB
func getDB(c *fiber.Ctx) *pgxpool.Pool {
	return middleware.GetTenantDB(c)
}

// Book Handlers

func GetBooks(c *fiber.Ctx) error {
	db := getDB(c)
	schoolID := c.Locals("school_id")
	search := c.Query("search")

	query := `SELECT id, school_id, title, author, isbn, category, total_copies, available_copies, qr_code, publication_year, description, created_at, updated_at 
	          FROM books WHERE school_id = $1`

	args := []interface{}{schoolID}
	if search != "" {
		query += ` AND (title ILIKE $2 OR author ILIKE $2 OR isbn ILIKE $2)`
		args = append(args, "%"+search+"%")
	}
	query += " ORDER BY created_at DESC"

	rows, err := db.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	books := []database.Book{}
	for rows.Next() {
		var b database.Book
		err := rows.Scan(&b.ID, &b.SchoolID, &b.Title, &b.Author, &b.ISBN, &b.Category, &b.TotalCopies, &b.AvailableCopies, &b.QRCode, &b.PublicationYear, &b.Description, &b.CreatedAt, &b.UpdatedAt)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		books = append(books, b)
	}

	return c.JSON(books)
}

func CreateBook(c *fiber.Ctx) error {
	db := getDB(c)
	schoolID := c.Locals("school_id")

	var b database.Book
	if err := c.BodyParser(&b); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	b.SchoolID = fmt.Sprintf("%v", schoolID)
	if b.AvailableCopies == 0 {
		b.AvailableCopies = b.TotalCopies
	}

	query := `INSERT INTO books (school_id, title, author, isbn, category, total_copies, available_copies, qr_code, publication_year, description)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at, updated_at`

	err := db.QueryRow(context.Background(), query, b.SchoolID, b.Title, b.Author, b.ISBN, b.Category, b.TotalCopies, b.AvailableCopies, b.QRCode, b.PublicationYear, b.Description).
		Scan(&b.ID, &b.CreatedAt, &b.UpdatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(b)
}

func GetBook(c *fiber.Ctx) error {
	db := getDB(c)
	id := c.Params("id")
	schoolID := c.Locals("school_id")

	var b database.Book
	query := `SELECT id, school_id, title, author, isbn, category, total_copies, available_copies, qr_code, publication_year, description, created_at, updated_at 
	          FROM books WHERE id = $1 AND school_id = $2`

	err := db.QueryRow(context.Background(), query, id, schoolID).
		Scan(&b.ID, &b.SchoolID, &b.Title, &b.Author, &b.ISBN, &b.Category, &b.TotalCopies, &b.AvailableCopies, &b.QRCode, &b.PublicationYear, &b.Description, &b.CreatedAt, &b.UpdatedAt)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Book not found"})
	}

	return c.JSON(b)
}

func UpdateBook(c *fiber.Ctx) error {
	db := getDB(c)
	id := c.Params("id")
	schoolID := c.Locals("school_id")

	var b database.Book
	if err := c.BodyParser(&b); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	query := `UPDATE books SET title=$1, author=$2, isbn=$3, category=$4, total_copies=$5, available_copies=$6, qr_code=$7, publication_year=$8, description=$9, updated_at=CURRENT_TIMESTAMP
	          WHERE id=$10 AND school_id=$11 RETURNING updated_at`

	err := db.QueryRow(context.Background(), query, b.Title, b.Author, b.ISBN, b.Category, b.TotalCopies, b.AvailableCopies, b.QRCode, b.PublicationYear, b.Description, id, schoolID).
		Scan(&b.UpdatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(b)
}

func DeleteBook(c *fiber.Ctx) error {
	db := getDB(c)
	id := c.Params("id")
	schoolID := c.Locals("school_id")

	query := `DELETE FROM books WHERE id = $1 AND school_id = $2`
	_, err := db.Exec(context.Background(), query, id, schoolID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(204).Send(nil)
}

// Issue Handlers

func IssueBook(c *fiber.Ctx) error {
	db := getDB(c)
	schoolID := c.Locals("school_id")

	var issue database.BookIssue
	if err := c.BodyParser(&issue); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	issue.SchoolID = fmt.Sprintf("%v", schoolID)
	if issue.IssueDate.IsZero() {
		issue.IssueDate = time.Now()
	}
	if issue.Status == "" {
		issue.Status = "Issued"
	}

	// Transaction to update book count and create issue record
	tx, err := db.Begin(context.Background())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start transaction"})
	}
	defer tx.Rollback(context.Background())

	// Check availability
	var available int
	err = tx.QueryRow(context.Background(), "SELECT available_copies FROM books WHERE id = $1 AND school_id = $2 FOR UPDATE", issue.BookID, schoolID).Scan(&available)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Book not found"})
	}

	if available <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No copies available"})
	}

	// Update available copies
	_, err = tx.Exec(context.Background(), "UPDATE books SET available_copies = available_copies - 1 WHERE id = $1", issue.BookID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update book count"})
	}

	// Create issue record
	query := `INSERT INTO book_issues (school_id, book_id, student_id, issue_date, due_date, status)
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`

	err = tx.QueryRow(context.Background(), query, issue.SchoolID, issue.BookID, issue.StudentID, issue.IssueDate, issue.DueDate, issue.Status).
		Scan(&issue.ID, &issue.CreatedAt, &issue.UpdatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create issue record"})
	}

	if err := tx.Commit(context.Background()); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to commit transaction"})
	}

	return c.Status(201).JSON(issue)
}

func ReturnBook(c *fiber.Ctx) error {
	db := getDB(c)
	id := c.Params("id")
	schoolID := c.Locals("school_id")

	// Get issue details
	var issue database.BookIssue
	err := db.QueryRow(context.Background(), "SELECT book_id, due_date, status FROM book_issues WHERE id = $1 AND school_id = $2", id, schoolID).
		Scan(&issue.BookID, &issue.DueDate, &issue.Status)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Issue record not found"})
	}

	if issue.Status == "Returned" {
		return c.Status(400).JSON(fiber.Map{"error": "Book already returned"})
	}

	returnDate := time.Now()
	fine := 0.0
	if returnDate.After(issue.DueDate) {
		daysOverdue := int(math.Ceil(returnDate.Sub(issue.DueDate).Hours() / 24))
		fine = float64(daysOverdue * 10) // 10 currency units per day
	}

	tx, err := db.Begin(context.Background())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start transaction"})
	}
	defer tx.Rollback(context.Background())

	// Update issue record
	_, err = tx.Exec(context.Background(), "UPDATE book_issues SET return_date=$1, status='Returned', fine=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3", returnDate, fine, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update issue record"})
	}

	// Update available copies
	_, err = tx.Exec(context.Background(), "UPDATE books SET available_copies = available_copies + 1 WHERE id = $1", issue.BookID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update book count"})
	}

	if err := tx.Commit(context.Background()); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to commit transaction"})
	}

	return c.JSON(fiber.Map{"message": "Book returned successfully", "fine": fine})
}

func GetIssues(c *fiber.Ctx) error {
	db := getDB(c)
	schoolID := c.Locals("school_id")
	status := c.Query("status")

	query := `SELECT i.id, i.school_id, i.book_id, i.student_id, i.issue_date, i.due_date, i.return_date, i.status, i.fine, i.created_at, i.updated_at
	          FROM book_issues i WHERE i.school_id = $1`

	args := []interface{}{schoolID}
	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY i.created_at DESC"

	rows, err := db.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	issues := []database.BookIssue{}
	for rows.Next() {
		var i database.BookIssue
		err := rows.Scan(&i.ID, &i.SchoolID, &i.BookID, &i.StudentID, &i.IssueDate, &i.DueDate, &i.ReturnDate, &i.Status, &i.Fine, &i.CreatedAt, &i.UpdatedAt)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		issues = append(issues, i)
	}

	return c.JSON(issues)
}

// Booking Handlers

func CreateBooking(c *fiber.Ctx) error {
	db := getDB(c)
	schoolID := c.Locals("school_id")

	var b database.BookBooking
	if err := c.BodyParser(&b); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	b.SchoolID = fmt.Sprintf("%v", schoolID)
	if b.BookingDate.IsZero() {
		b.BookingDate = time.Now()
	}
	if b.Status == "" {
		b.Status = "Pending"
	}

	query := `INSERT INTO book_bookings (school_id, book_id, student_id, booking_date, priority, status)
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`

	err := db.QueryRow(context.Background(), query, b.SchoolID, b.BookID, b.StudentID, b.BookingDate, b.Priority, b.Status).
		Scan(&b.ID, &b.CreatedAt, &b.UpdatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(b)
}

func GetBookings(c *fiber.Ctx) error {
	db := getDB(c)
	schoolID := c.Locals("school_id")

	query := `SELECT id, school_id, book_id, student_id, booking_date, priority, status, created_at, updated_at 
	          FROM book_bookings WHERE school_id = $1 ORDER BY created_at DESC`

	rows, err := db.Query(context.Background(), query, schoolID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	bookings := []database.BookBooking{}
	for rows.Next() {
		var b database.BookBooking
		err := rows.Scan(&b.ID, &b.SchoolID, &b.BookID, &b.StudentID, &b.BookingDate, &b.Priority, &b.Status, &b.CreatedAt, &b.UpdatedAt)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		bookings = append(bookings, b)
	}

	return c.JSON(bookings)
}

func UpdateBookingStatus(c *fiber.Ctx) error {
	db := getDB(c)
	id := c.Params("id")
	schoolID := c.Locals("school_id")

	type StatusUpdate struct {
		Status string `json:"status"`
	}
	var update StatusUpdate
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	query := `UPDATE book_bookings SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND school_id=$3`
	_, err := db.Exec(context.Background(), query, update.Status, id, schoolID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Booking status updated"})
}
