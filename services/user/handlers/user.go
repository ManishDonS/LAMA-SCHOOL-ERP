package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/user/config"
	"school-erp/user/database"
	"school-erp/user/middleware"
)

type UserHandler struct {
	db  *pgxpool.Pool
	cfg *config.Config
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
	FirstName     string `json:"first_name" validate:"required"`
	LastName      string `json:"last_name" validate:"required"`
	Email         string `json:"email" validate:"required,email"`
	Password      string `json:"password" validate:"required"`
	SchoolID      string `json:"school_id" validate:"required"`
	Qualification string `json:"qualification" validate:"required"`
	Department    string `json:"department"`
	EmployeeID    string `json:"employee_id" validate:"required"`
}

type CreateParentRequest struct {
	UserID      string `json:"user_id" validate:"required"`
	PhoneNumber string `json:"phone_number"`
	Occupation  string `json:"occupation"`
	Address     string `json:"address"`
}

type CreateStaffRequest struct {
	UserID     string `json:"user_id" validate:"required"`
	Department string `json:"department"`
	Position   string `json:"position"`
	EmployeeID string `json:"employee_id" validate:"required"`
}

func NewUserHandler(db *pgxpool.Pool, cfg *config.Config) *UserHandler {
	return &UserHandler{db: db, cfg: cfg}
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

	// 1. Create User in Auth Service
	authPayload := map[string]interface{}{
		"email":      req.Email,
		"password":   req.Password,
		"first_name": req.FirstName,
		"last_name":  req.LastName,
		"role":       "teacher",
		"school_id":  req.SchoolID,
	}

	authBody, err := json.Marshal(authPayload)
	if err != nil {
		fmt.Printf("Error marshalling auth payload: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to prepare auth request"})
	}

	authURL := fmt.Sprintf("%s/api/v1/auth/register", h.cfg.AuthServiceURL)
	fmt.Printf("Calling Auth Service: %s with payload: %s\n", authURL, string(authBody))

	// Create request
	proxyReq, err := http.NewRequest("POST", authURL, bytes.NewBuffer(authBody))
	if err != nil {
		fmt.Printf("Error creating auth request: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create auth request"})
	}
	proxyReq.Header.Set("Content-Type", "application/json")

	// Forward Tenant Code
	tenantCode := middleware.GetTenantCode(c)
	if tenantCode != "" {
		proxyReq.Header.Set("X-Tenant-Code", tenantCode)
	}

	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		fmt.Printf("Error connecting to Auth Service: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to connect to Auth Service"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		var authErr map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&authErr)
		fmt.Printf("Auth Service returned error: %d, %v\n", resp.StatusCode, authErr)
		return c.Status(resp.StatusCode).JSON(authErr)
	}

	var authResp struct {
		Data struct {
			UserID string `json:"user_id"`
			ID     string `json:"id"` // Try scanning both
		} `json:"data"`
	}
	// Decode into buffer to print it too
	var buf bytes.Buffer
	buf.ReadFrom(resp.Body)
	fmt.Printf("Auth Service Response Body: %s\n", buf.String())

	if err := json.Unmarshal(buf.Bytes(), &authResp); err != nil {
		fmt.Printf("Error decoding auth response: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse auth response"})
	}

	userID := authResp.Data.UserID
	if userID == "" {
		userID = authResp.Data.ID // Fallback
	}
	fmt.Printf("Extracted UserID: %s\n", userID)

	// 2. Create Teacher in Tenant Database
	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		fmt.Println("Failed to connect to tenant database (tenantDB is nil)")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	fmt.Printf("Inserting teacher into tenant DB. UserID: %s, SchoolID: %s\n", userID, req.SchoolID)

	_, err = tenantDB.Exec(
		c.Context(),
		`INSERT INTO teachers (user_id, school_id, qualification, department, employee_id, join_date, status)
		 VALUES ($1, $2, $3, $4, $5, NOW(), 'active')`,
		userID, req.SchoolID, req.Qualification, req.Department, req.EmployeeID,
	)

	if err != nil {
		fmt.Printf("Error inserting teacher into DB: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to create teacher",
			"details": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Teacher created successfully",
		"user_id": userID,
	})
}

func (h *UserHandler) CreateTeacherInternal(ctx context.Context, db *pgxpool.Pool, teacher *database.Teacher) error {
	// Legacy support or internal use
	_, err := db.Exec(
		ctx,
		`INSERT INTO teachers (user_id, qualification, department, employee_id, join_date, status)
		 VALUES ($1, $2, $3, $4, NOW(), 'active')`,
		teacher.UserID, teacher.Qualification, teacher.Department, teacher.EmployeeID,
	)
	return err
}

func (h *UserHandler) GetTeacher(c *fiber.Ctx) error {
	id := c.Params("id")

	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	var teacher database.Teacher
	// Assuming id is the teacher table ID (BIGINT/Serial) based on models,
	// but migrating to UUIDs might mean we query by string ID or UserID.
	// The migration uses BIGSERIAL for ID but VARCHAR for UserID.
	// Let's assume the ID param is the internal ID for now, or we might need to support UserID lookup.
	// Given standard REST patterns, ID usually means resource ID.

	query := `
		SELECT id, user_id, qualification, department, employee_id, join_date, status
		FROM teachers WHERE id = $1
	`

	err := tenantDB.QueryRow(c.Context(), query, id).Scan(
		&teacher.ID, &teacher.UserID, &teacher.Qualification,
		&teacher.Department, &teacher.EmployeeID, &teacher.JoinDate, &teacher.Status,
	)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Teacher not found",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Teacher retrieved successfully",
		"teacher": teacher,
	})
}

func (h *UserHandler) GetTeachers(c *fiber.Ctx) error {
	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	query := `
		SELECT t.id, t.user_id, t.qualification, t.department, t.employee_id, t.join_date, t.status,
		       u.first_name, u.last_name, u.email
		FROM teachers t
		JOIN users u ON t.user_id::uuid = u.id
		ORDER BY t.created_at DESC
	`

	rows, err := tenantDB.Query(c.Context(), query)
	if err != nil {
		fmt.Printf("Error fetching teachers: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch teachers",
		})
	}
	defer rows.Close()

	var teachers []database.Teacher
	for rows.Next() {
		var t database.Teacher
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.Qualification, &t.Department, &t.EmployeeID, &t.JoinDate, &t.Status,
			&t.FirstName, &t.LastName, &t.Email,
		); err != nil {
			fmt.Printf("Error scanning teacher row: %v\n", err)
			continue
		}
		teachers = append(teachers, t)
	}

	if teachers == nil {
		teachers = []database.Teacher{}
	}

	return c.JSON(fiber.Map{
		"message":  "Teachers retrieved successfully",
		"teachers": teachers,
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

func (h *UserHandler) CreateParentInternal(ctx context.Context, userID string, phoneNumber, occupation, address string) error {
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
