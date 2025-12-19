package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/user/config"
	"school-erp/user/database"
	"school-erp/user/middleware"
	"school-erp/user/pkg/tenant"
)

type UserHandler struct {
	db  *pgxpool.Pool
	cfg *config.Config
	tm  *tenant.TenantManager
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
	FirstName      string  `json:"first_name" validate:"required"`
	LastName       string  `json:"last_name" validate:"required"`
	Email          string  `json:"email" validate:"required,email"`
	Password       string  `json:"password" validate:"required"`
	SchoolID       string  `json:"school_id" validate:"required"`
	Qualification  string  `json:"qualification" validate:"required"`
	Phone          string  `json:"phone"`
	DateOfBirth    string  `json:"date_of_birth"`
	Gender         string  `json:"gender"`
	Specialization string  `json:"specialization"`
	Experience     float64 `json:"experience"`
	EmploymentType string  `json:"employment_type"`
	Salary         float64 `json:"salary"`
	Address        string  `json:"address"`
	City           string  `json:"city"`
	State          string  `json:"state"`
	Subject        string  `json:"subject"`
	ClassAssigned  string  `json:"class_assigned"`
	Department     string  `json:"department"`
	EmployeeID     string  `json:"employee_id" validate:"required"`
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

func NewUserHandler(db *pgxpool.Pool, cfg *config.Config, tm *tenant.TenantManager) *UserHandler {
	return &UserHandler{db: db, cfg: cfg, tm: tm}
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
	tenantCode = middleware.GetTenantCode(c)

	if tenantDB == nil && req.SchoolID != "" {
		fmt.Printf("Tenant DB not resolved from context, attempting resolution via SchoolID: %s\n", req.SchoolID)
		var err error
		tenantDB, tenantCode, err = h.getTenantDBBySchoolID(c.Context(), req.SchoolID)
		if err != nil {
			fmt.Printf("Failed to resolve tenant DB via SchoolID: %v\n", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Failed to resolve school database",
				"details": err.Error(),
			})
		}
	}

	if tenantDB == nil {
		fmt.Println("Failed to connect to tenant database (tenantDB is nil)")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	fmt.Printf("Inserting teacher into tenant DB: %s. UserID: %s, SchoolID: %s\n", tenantCode, userID, req.SchoolID)

	// 2.5 Sync User to Tenant DB first (Crucial for list join!)
	err = h.SyncUserToTenant(c.Context(), tenantDB, userID, req.Email, req.FirstName, req.LastName, "teacher")
	if err != nil {
		fmt.Printf("Warning: Failed to sync user to tenant DB: %v\n", err)
		// Continue anyway as teacher record is primary, but joining might fail
	}

	// 3. Create Teacher in Database
	// Convert DateOfBirth string to time.Time if provided
	var dob interface{}
	if req.DateOfBirth != "" {
		t, err := time.Parse("2006-01-02", req.DateOfBirth)
		if err == nil {
			dob = t
		}
	}

	_, err = tenantDB.Exec(
		c.Context(),
		`INSERT INTO teachers (
			user_id, school_id, qualification, department, employee_id, 
			phone, date_of_birth, gender, specialization, experience, 
			employment_type, salary, address, city, state, 
			subject, class_assigned, join_date, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), 'active')
		ON CONFLICT (user_id) DO UPDATE SET
			qualification = EXCLUDED.qualification,
			department = EXCLUDED.department,
			employee_id = EXCLUDED.employee_id,
			phone = EXCLUDED.phone,
			date_of_birth = EXCLUDED.date_of_birth,
			gender = EXCLUDED.gender,
			specialization = EXCLUDED.specialization,
			experience = EXCLUDED.experience,
			employment_type = EXCLUDED.employment_type,
			salary = EXCLUDED.salary,
			address = EXCLUDED.address,
			city = EXCLUDED.city,
			state = EXCLUDED.state,
			subject = EXCLUDED.subject,
			class_assigned = EXCLUDED.class_assigned,
			updated_at = NOW()`,
		userID, req.SchoolID, req.Qualification, req.Department, req.EmployeeID,
		req.Phone, dob, req.Gender, req.Specialization, req.Experience,
		req.EmploymentType, req.Salary, req.Address, req.City, req.State,
		req.Subject, req.ClassAssigned,
	)

	if err != nil {
		fmt.Printf("Error inserting/updating teacher in DB: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to save teacher profile",
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
		SELECT id, user_id, qualification, department, employee_id, 
		       phone, date_of_birth, gender, specialization, experience, 
		       employment_type, salary, address, city, state, 
		       subject, class_assigned, join_date, status
		FROM teachers WHERE id = $1
	`

	err := tenantDB.QueryRow(c.Context(), query, id).Scan(
		&teacher.ID, &teacher.UserID, &teacher.Qualification, &teacher.Department, &teacher.EmployeeID,
		&teacher.Phone, &teacher.DateOfBirth, &teacher.Gender, &teacher.Specialization, &teacher.Experience,
		&teacher.EmploymentType, &teacher.Salary, &teacher.Address, &teacher.City, &teacher.State,
		&teacher.Subject, &teacher.ClassAssigned, &teacher.JoinDate, &teacher.Status,
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
		SELECT t.id, t.user_id, t.qualification, t.department, t.employee_id, 
		       t.phone, t.date_of_birth, t.gender, t.specialization, t.experience, 
		       t.employment_type, t.salary, t.address, t.city, t.state, 
		       t.subject, t.class_assigned, t.join_date, t.status,
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
			&t.ID, &t.UserID, &t.Qualification, &t.Department, &t.EmployeeID,
			&t.Phone, &t.DateOfBirth, &t.Gender, &t.Specialization, &t.Experience,
			&t.EmploymentType, &t.Salary, &t.Address, &t.City, &t.State,
			&t.Subject, &t.ClassAssigned, &t.JoinDate, &t.Status,
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

	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// 1. Get the user_id for this teacher first
	var userID string
	err := tenantDB.QueryRow(c.Context(), "SELECT user_id FROM teachers WHERE id = $1", id).Scan(&userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Teacher not found",
		})
	}

	// 2. Update User in Main DB (Auth database) and Tenant DB
	// We can update first_name, last_name, and email in both central and tenant users tables
	if req.FirstName != "" || req.LastName != "" || req.Email != "" {
		updateUserQuery := "UPDATE users SET "
		userArgs := []interface{}{}
		argPos := 1

		if req.FirstName != "" {
			updateUserQuery += fmt.Sprintf("first_name = $%d, ", argPos)
			userArgs = append(userArgs, req.FirstName)
			argPos++
		}
		if req.LastName != "" {
			updateUserQuery += fmt.Sprintf("last_name = $%d, ", argPos)
			userArgs = append(userArgs, req.LastName)
			argPos++
		}
		if req.Email != "" {
			updateUserQuery += fmt.Sprintf("email = $%d, ", argPos)
			userArgs = append(userArgs, req.Email)
			argPos++
		}

		// Remove trailing comma and space
		updateUserQuery = updateUserQuery[:len(updateUserQuery)-2]
		updateUserQuery += fmt.Sprintf(" WHERE id = $%d", argPos)
		userArgs = append(userArgs, userID)

		// Update Central DB
		_, err = h.db.Exec(c.Context(), updateUserQuery, userArgs...)
		if err != nil {
			fmt.Printf("Error updating user in main DB: %v\n", err)
			// Log but continue to update tenant DB and teacher record
		}

		// Update Tenant DB
		_, err = tenantDB.Exec(c.Context(), updateUserQuery, userArgs...)
		if err != nil {
			fmt.Printf("Error updating user in tenant DB: %v\n", err)
			// If tenant users table doesn't have the user yet (e.g. from old data), this might fail.
			// In a real system we might want to UPSERT here.
		}
	}

	// 3. Update Teacher in Tenant DB
	updateFields := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Qualification != "" {
		updateFields = append(updateFields, fmt.Sprintf("qualification = $%d", argPos))
		args = append(args, req.Qualification)
		argPos++
	}
	if req.Department != "" {
		updateFields = append(updateFields, fmt.Sprintf("department = $%d", argPos))
		args = append(args, req.Department)
		argPos++
	}
	if req.EmployeeID != "" {
		updateFields = append(updateFields, fmt.Sprintf("employee_id = $%d", argPos))
		args = append(args, req.EmployeeID)
		argPos++
	}
	if req.Phone != "" {
		updateFields = append(updateFields, fmt.Sprintf("phone = $%d", argPos))
		args = append(args, req.Phone)
		argPos++
	}
	if req.Gender != "" {
		updateFields = append(updateFields, fmt.Sprintf("gender = $%d", argPos))
		args = append(args, req.Gender)
		argPos++
	}
	if req.Specialization != "" {
		updateFields = append(updateFields, fmt.Sprintf("specialization = $%d", argPos))
		args = append(args, req.Specialization)
		argPos++
	}
	if req.Experience != 0 {
		updateFields = append(updateFields, fmt.Sprintf("experience = $%d", argPos))
		args = append(args, req.Experience)
		argPos++
	}
	if req.EmploymentType != "" {
		updateFields = append(updateFields, fmt.Sprintf("employment_type = $%d", argPos))
		args = append(args, req.EmploymentType)
		argPos++
	}
	if req.Salary != 0 {
		updateFields = append(updateFields, fmt.Sprintf("salary = $%d", argPos))
		args = append(args, req.Salary)
		argPos++
	}
	if req.Address != "" {
		updateFields = append(updateFields, fmt.Sprintf("address = $%d", argPos))
		args = append(args, req.Address)
		argPos++
	}
	if req.City != "" {
		updateFields = append(updateFields, fmt.Sprintf("city = $%d", argPos))
		args = append(args, req.City)
		argPos++
	}
	if req.State != "" {
		updateFields = append(updateFields, fmt.Sprintf("state = $%d", argPos))
		args = append(args, req.State)
		argPos++
	}
	if req.Subject != "" {
		updateFields = append(updateFields, fmt.Sprintf("subject = $%d", argPos))
		args = append(args, req.Subject)
		argPos++
	}
	if req.ClassAssigned != "" {
		updateFields = append(updateFields, fmt.Sprintf("class_assigned = $%d", argPos))
		args = append(args, req.ClassAssigned)
		argPos++
	}

	if len(updateFields) == 0 {
		return c.JSON(fiber.Map{
			"message":    "Teacher updated successfully (no fields changed)",
			"teacher_id": id,
		})
	}

	updateFields = append(updateFields, fmt.Sprintf("updated_at = $%d", argPos))
	args = append(args, time.Now())
	argPos++

	args = append(args, id)
	query := fmt.Sprintf("UPDATE teachers SET %s WHERE id = $%d", strings.Join(updateFields, ", "), argPos)

	_, err = tenantDB.Exec(c.Context(), query, args...)
	if err != nil {
		fmt.Printf("Error updating teacher in tenant DB: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update teacher record",
		})
	}

	return c.JSON(fiber.Map{
		"message":    "Teacher updated successfully",
		"teacher_id": id,
	})
}

func (h *UserHandler) DeleteTeacher(c *fiber.Ctx) error {
	id := c.Params("id")

	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// 1. Get user_id first to optionally disable/delete user
	var userID string
	err := tenantDB.QueryRow(c.Context(), "SELECT user_id FROM teachers WHERE id = $1", id).Scan(&userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Teacher not found",
		})
	}

	// 2. Delete teacher record
	_, err = tenantDB.Exec(c.Context(), "DELETE FROM teachers WHERE id = $1", id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete teacher record",
		})
	}

	// 3. Mark user as inactive in central DB (Soft delete for safety)
	_, err = h.db.Exec(c.Context(), "UPDATE users SET status = 'inactive' WHERE id = $1", userID)
	if err != nil {
		fmt.Printf("Warning: Failed to deactivate user in central DB: %v\n", err)
	}

	// 4. Mark user as inactive in tenant DB
	_, err = tenantDB.Exec(c.Context(), "UPDATE users SET status = 'inactive' WHERE id = $1", userID)
	if err != nil {
		fmt.Printf("Warning: Failed to deactivate user in tenant DB: %v\n", err)
	}

	return c.JSON(fiber.Map{
		"message": "Teacher deleted successfully",
		"id":      id,
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
func (h *UserHandler) getTenantDBBySchoolID(ctx context.Context, schoolID string) (*pgxpool.Pool, string, error) {
	var dbUser, encryptedPassword, dbName, code string
	query := `SELECT db_user, db_password, db_name, code FROM schools WHERE id = $1 AND status = 'active'`
	err := h.db.QueryRow(ctx, query, schoolID).Scan(&dbUser, &encryptedPassword, &dbName, &code)
	if err != nil {
		return nil, "", fmt.Errorf("school not found or inactive: %w", err)
	}

	dbPort, _ := strconv.Atoi(h.cfg.DBPort)
	tenantDB, err := h.tm.GetConnection(
		ctx,
		code,
		h.cfg.DBHost,
		dbPort,
		dbName,
		dbUser,
		encryptedPassword,
		database.RunMigrations,
	)
	if err != nil {
		return nil, "", fmt.Errorf("failed to connect to tenant database: %w", err)
	}

	return tenantDB, code, nil
}

func (h *UserHandler) SyncUserToTenant(ctx context.Context, tenantDB *pgxpool.Pool, userID string, email, firstName, lastName, role string) error {
	query := `
		INSERT INTO users (id, email, first_name, last_name, role, password_hash, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			email = EXCLUDED.email,
			first_name = EXCLUDED.first_name,
			last_name = EXCLUDED.last_name,
			role = EXCLUDED.role,
			updated_at = NOW()
	`
	_, err := tenantDB.Exec(ctx, query, userID, email, firstName, lastName, role, "EXTERNAL_AUTH", "active")
	return err
}
