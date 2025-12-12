package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StudentHandler struct {
	db *pgxpool.Pool
}

type Student struct {
	ID          string `json:"id"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	DateOfBirth string `json:"date_of_birth"`
	ClassID     string `json:"class_id"`
}

type CreateStudentRequest struct {
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	DateOfBirth string `json:"date_of_birth"`
	ClassID     string `json:"class_id"`
}

type EnrollmentRequest struct {
	StudentID    string `json:"student_id"`
	ClassID      string `json:"class_id"`
	AcademicYear string `json:"academic_year"`
}

func NewStudentHandler(db *pgxpool.Pool) *StudentHandler {
	return &StudentHandler{db: db}
}

// ListStudents godoc
// @Summary List all students
// @Description Get a list of all registered students
// @Tags students
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /students [get]
func (h *StudentHandler) ListStudents(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Students list", "students": []Student{}})
}

// GetStudent godoc
// @Summary Get a student
// @Description Get details of a specific student by ID
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} Student
// @Failure 404 {object} map[string]interface{}
// @Router /students/{id} [get]
func (h *StudentHandler) GetStudent(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Student retrieved", "student_id": id})
}

// CreateStudent godoc
// @Summary Create a new student
// @Description Register a new student in the system
// @Tags students
// @Accept json
// @Produce json
// @Param student body CreateStudentRequest true "Student Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /students [post]
func (h *StudentHandler) CreateStudent(c *fiber.Ctx) error {
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Student created"})
}

// UpdateStudent godoc
// @Summary Update a student
// @Description Update details of an existing student
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Param student body CreateStudentRequest true "Student Data"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /students/{id} [put]
func (h *StudentHandler) UpdateStudent(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Student updated", "student_id": id})
}

// DeleteStudent godoc
// @Summary Delete a student
// @Description Remove a student from the system
// @Tags students
// @Accept json
// @Produce json
// @Param id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /students/{id} [delete]
func (h *StudentHandler) DeleteStudent(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Student deleted", "student_id": id})
}

// GetStudentEnrollments godoc
// @Summary Get student enrollments
// @Description Get a list of class enrollments for a student
// @Tags students
// @Accept json
// @Produce json
// @Param student_id path string true "Student ID"
// @Success 200 {object} map[string]interface{}
// @Router /students/{student_id}/enrollments [get]
func (h *StudentHandler) GetStudentEnrollments(c *fiber.Ctx) error {
	studentID := c.Params("student_id")
	return c.JSON(fiber.Map{"message": "Enrollments", "student_id": studentID, "enrollments": []fiber.Map{}})
}

// EnrollStudent godoc
// @Summary Enroll a student
// @Description Enroll a student in a class
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollment body EnrollmentRequest true "Enrollment Data"
// @Success 201 {object} map[string]interface{}
// @Router /enrollments [post]
func (h *StudentHandler) EnrollStudent(c *fiber.Ctx) error {
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Student enrolled"})
}

// RemoveEnrollment godoc
// @Summary Remove enrollment
// @Description Remove a student from a class
// @Tags enrollments
// @Accept json
// @Produce json
// @Param id path string true "Enrollment ID"
// @Success 200 {object} map[string]interface{}
// @Router /enrollments/{id} [delete]
func (h *StudentHandler) RemoveEnrollment(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Enrollment removed", "enrollment_id": id})
}
