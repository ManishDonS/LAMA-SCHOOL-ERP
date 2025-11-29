package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/user/database"
)

type UserHandler struct {
	db *pgxpool.Pool
}

type CreateUserRequest struct {
	SchoolID  int64  `json:"school_id" validate:"required"`
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
	Role      string `json:"role" validate:"required"`
}

type UpdateUserRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

type CreateTeacherRequest struct {
	UserID        int64  `json:"user_id" validate:"required"`
	Qualification string `json:"qualification" validate:"required"`
	Department    string `json:"department"`
	EmployeeID    string `json:"employee_id" validate:"required"`
}

type CreateParentRequest struct {
	UserID      int64  `json:"user_id" validate:"required"`
	PhoneNumber string `json:"phone_number"`
	Occupation  string `json:"occupation"`
	Address     string `json:"address"`
}

type CreateStaffRequest struct {
	UserID     int64  `json:"user_id" validate:"required"`
	Department string `json:"department"`
	Position   string `json:"position"`
	EmployeeID string `json:"employee_id" validate:"required"`
}

func NewUserHandler(db *pgxpool.Pool) *UserHandler {
	return &UserHandler{db: db}
}

// User endpoints

func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User created successfully",
		"data": fiber.Map{
			"school_id": req.SchoolID,
			"email":     req.Email,
		},
	})
}

func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")

	return c.JSON(fiber.Map{
		"message": "User retrieved successfully",
		"user_id": id,
	})
}

func (h *UserHandler) GetUsersBySchool(c *fiber.Ctx) error {
	schoolID := c.Params("school_id")

	return c.JSON(fiber.Map{
		"message":   "Users retrieved successfully",
		"school_id": schoolID,
		"users":     []fiber.Map{},
	})
}

func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	return c.JSON(fiber.Map{
		"message": "User updated successfully",
		"user_id": id,
	})
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")

	return c.JSON(fiber.Map{
		"message": "User deleted successfully",
		"user_id": id,
	})
}

// Teacher endpoints

func (h *UserHandler) CreateTeacher(c *fiber.Ctx) error {
	var req CreateTeacherRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	teacher := &database.Teacher{
		UserID:        req.UserID,
		Qualification: req.Qualification,
		Department:    req.Department,
		EmployeeID:    req.EmployeeID,
	}

	if err := h.CreateTeacherInternal(c.Context(), teacher); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create teacher",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Teacher created successfully",
	})
}

func (h *UserHandler) CreateTeacherInternal(ctx context.Context, teacher *database.Teacher) error {
	_, err := h.db.Exec(
		ctx,
		`INSERT INTO teachers (user_id, qualification, department, employee_id, join_date, status)
		 VALUES ($1, $2, $3, $4, NOW(), 'active')`,
		teacher.UserID, teacher.Qualification, teacher.Department, teacher.EmployeeID,
	)
	return err
}

func (h *UserHandler) GetTeacher(c *fiber.Ctx) error {
	id := c.Params("id")

	return c.JSON(fiber.Map{
		"message":    "Teacher retrieved successfully",
		"teacher_id": id,
	})
}

func (h *UserHandler) GetTeachers(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message":  "Teachers retrieved successfully",
		"teachers": []fiber.Map{},
	})
}

func (h *UserHandler) UpdateTeacher(c *fiber.Ctx) error {
	id := c.Params("id")
	var req CreateTeacherRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	return c.JSON(fiber.Map{
		"message":    "Teacher updated successfully",
		"teacher_id": id,
	})
}

// Parent endpoints

func (h *UserHandler) CreateParent(c *fiber.Ctx) error {
	var req CreateParentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.CreateParentInternal(c.Context(), req.UserID, req.PhoneNumber, req.Occupation, req.Address); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create parent",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Parent created successfully",
	})
}

func (h *UserHandler) CreateParentInternal(ctx context.Context, userID int64, phoneNumber, occupation, address string) error {
	_, err := h.db.Exec(
		ctx,
		`INSERT INTO parents (user_id, phone_number, occupation, address)
		 VALUES ($1, $2, $3, $4)`,
		userID, phoneNumber, occupation, address,
	)
	return err
}

func (h *UserHandler) GetParent(c *fiber.Ctx) error {
	id := c.Params("id")

	return c.JSON(fiber.Map{
		"message":   "Parent retrieved successfully",
		"parent_id": id,
	})
}

func (h *UserHandler) GetParents(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Parents retrieved successfully",
		"parents": []fiber.Map{},
	})
}

func (h *UserHandler) UpdateParent(c *fiber.Ctx) error {
	id := c.Params("id")
	var req CreateParentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	return c.JSON(fiber.Map{
		"message":   "Parent updated successfully",
		"parent_id": id,
	})
}

// Staff endpoints

func (h *UserHandler) CreateStaff(c *fiber.Ctx) error {
	var req CreateStaffRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	_, err := h.db.Exec(
		c.Context(),
		`INSERT INTO staff (user_id, department, position, employee_id, join_date, status)
		 VALUES ($1, $2, $3, $4, NOW(), 'active')`,
		req.UserID, req.Department, req.Position, req.EmployeeID,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create staff member",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Staff member created successfully",
	})
}

func (h *UserHandler) GetStaffMember(c *fiber.Ctx) error {
	id := c.Params("id")

	return c.JSON(fiber.Map{
		"message":  "Staff member retrieved successfully",
		"staff_id": id,
	})
}

func (h *UserHandler) GetStaff(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Staff members retrieved successfully",
		"staff":   []fiber.Map{},
	})
}

func (h *UserHandler) UpdateStaff(c *fiber.Ctx) error {
	id := c.Params("id")
	var req CreateStaffRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	return c.JSON(fiber.Map{
		"message":  "Staff member updated successfully",
		"staff_id": id,
	})
}
