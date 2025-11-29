package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StudentHandler struct {
	db *pgxpool.Pool
}

func NewStudentHandler(db *pgxpool.Pool) *StudentHandler {
	return &StudentHandler{db: db}
}

func (h *StudentHandler) ListStudents(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Students list", "students": []fiber.Map{}})
}

func (h *StudentHandler) GetStudent(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Student retrieved", "student_id": id})
}

func (h *StudentHandler) CreateStudent(c *fiber.Ctx) error {
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Student created"})
}

func (h *StudentHandler) UpdateStudent(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Student updated", "student_id": id})
}

func (h *StudentHandler) DeleteStudent(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Student deleted", "student_id": id})
}

func (h *StudentHandler) GetStudentEnrollments(c *fiber.Ctx) error {
	studentID := c.Params("student_id")
	return c.JSON(fiber.Map{"message": "Enrollments", "student_id": studentID, "enrollments": []fiber.Map{}})
}

func (h *StudentHandler) EnrollStudent(c *fiber.Ctx) error {
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Student enrolled"})
}

func (h *StudentHandler) RemoveEnrollment(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{"message": "Enrollment removed", "enrollment_id": id})
}
