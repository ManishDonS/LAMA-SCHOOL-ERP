package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/school/pkg/tenant"
)

// SchoolHandler handles school-related requests
type SchoolHandler struct {
	db             *pgxpool.Pool
	tenantManager  *tenant.TenantManager
	validator      *validator.Validate
}

// NewSchoolHandler creates a new school handler
func NewSchoolHandler(db *pgxpool.Pool, tm *tenant.TenantManager) *SchoolHandler {
	return &SchoolHandler{
		db:            db,
		tenantManager: tm,
		validator:     validator.New(),
	}
}

// School represents the school model in response
type School struct {
	ID        int64     `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Code      string    `json:"code" db:"code"`
	DBName    string    `json:"db_name" db:"db_name"`
	Domain    string    `json:"domain" db:"domain"`
	LogoURL   string    `json:"logo_url" db:"logo_url"`
	Timezone  string    `json:"timezone" db:"timezone"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CreateSchoolRequest is the request body for creating a school
type CreateSchoolRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=255"`
	Code     string `json:"code" validate:"required,min=2,max=20"`
	Domain   string `json:"domain" validate:"required"`
	LogoURL  string `json:"logo_url" validate:"omitempty"`
	Timezone string `json:"timezone" validate:"required"`
	DBUser   string `json:"db_user" validate:"omitempty"`
	DBPassword string `json:"db_password" validate:"omitempty"`
}

// UpdateSchoolRequest is the request body for updating a school
type UpdateSchoolRequest struct {
	Name    string `json:"name" validate:"omitempty,min=2,max=255"`
	Domain  string `json:"domain" validate:"omitempty"`
	LogoURL string `json:"logo_url" validate:"omitempty"`
	Status  string `json:"status" validate:"omitempty,oneof=active inactive suspended"`
}

// CreateSchool handles POST /api/v1/schools
func (h *SchoolHandler) CreateSchool(c *fiber.Ctx) error {
	var req CreateSchoolRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	ctx := context.Background()

	// Auto-generate database credentials if not provided
	dbUser := req.DBUser
	dbPassword := req.DBPassword

	if dbUser == "" {
		dbUser = fmt.Sprintf("school_%s_user", req.Code)
	}

	if dbPassword == "" {
		// Generate a secure random password (16 characters)
		dbPassword = generateRandomPassword(16)
	}

	// Generate database name
	dbName := fmt.Sprintf("school_%s_db", req.Code)

	// Encrypt password
	encryptedPassword, err := h.tenantManager.EncryptPassword(dbPassword)
	if err != nil {
		log.Printf("Failed to encrypt password: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process school setup",
		})
	}

	// Create tenant database
	if err := h.tenantManager.CreateTenantDatabase(ctx, h.db, req.Code, dbName, dbUser, dbPassword); err != nil {
		log.Printf("Failed to create tenant database: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create database",
		})
	}

	// Get tenant connection and run migrations
	tenantDB, err := h.tenantManager.GetConnection(ctx, req.Code, "postgres", 5432, dbName, dbUser, encryptedPassword)
	if err != nil {
		log.Printf("Failed to get tenant connection: %v\n", err)
		// Try to drop the database since migrations failed
		h.tenantManager.DropTenantDatabase(ctx, h.db, req.Code, dbName)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to database",
		})
	}

	// Run tenant migrations
	if err := RunTenantMigrations(ctx, tenantDB); err != nil {
		log.Printf("Failed to run tenant migrations: %v\n", err)
		h.tenantManager.DropTenantDatabase(ctx, h.db, req.Code, dbName)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize database schema",
		})
	}

	// Insert school record in main database
	query := `
	INSERT INTO schools (name, code, db_name, db_user, db_password, db_host, db_port, domain, logo_url, timezone, status)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	RETURNING id, name, code, db_name, domain, logo_url, timezone, status, created_at, updated_at
	`

	var school School
	err = h.db.QueryRow(ctx, query,
		req.Name,
		req.Code,
		dbName,
		dbUser,
		encryptedPassword,
		"postgres",
		5432,
		req.Domain,
		req.LogoURL,
		req.Timezone,
		"active",
	).Scan(
		&school.ID,
		&school.Name,
		&school.Code,
		&school.DBName,
		&school.Domain,
		&school.LogoURL,
		&school.Timezone,
		&school.Status,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if err != nil {
		log.Printf("Failed to insert school: %v\n", err)
		h.tenantManager.DropTenantDatabase(ctx, h.db, req.Code, dbName)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save school record",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(school)
}

// GetSchools handles GET /api/v1/schools
func (h *SchoolHandler) GetSchools(c *fiber.Ctx) error {
	ctx := context.Background()

	// Get pagination params
	limit := c.QueryInt("limit", 10)
	offset := c.QueryInt("offset", 0)

	// Validate pagination
	if limit > 100 {
		limit = 100
	}

	query := `
	SELECT id, name, code, db_name, domain, COALESCE(logo_url, ''), timezone, status, created_at, updated_at
	FROM schools
	WHERE status != 'suspended'
	ORDER BY created_at DESC
	LIMIT $1 OFFSET $2
	`

	rows, err := h.db.Query(ctx, query, limit, offset)
	if err != nil {
		log.Printf("Failed to fetch schools: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch schools",
		})
	}
	defer rows.Close()

	var schools []School
	for rows.Next() {
		var school School
		if err := rows.Scan(
			&school.ID,
			&school.Name,
			&school.Code,
			&school.DBName,
			&school.Domain,
			&school.LogoURL,
			&school.Timezone,
			&school.Status,
			&school.CreatedAt,
			&school.UpdatedAt,
		); err != nil {
			log.Printf("Failed to scan school: %v\n", err)
			continue
		}
		schools = append(schools, school)
	}

	return c.JSON(fiber.Map{
		"data": schools,
		"pagination": fiber.Map{
			"limit":  limit,
			"offset": offset,
		},
	})
}

// GetSchool handles GET /api/v1/schools/:id
func (h *SchoolHandler) GetSchool(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	ctx := context.Background()

	query := `
	SELECT id, name, code, db_name, domain, COALESCE(logo_url, ''), timezone, status, created_at, updated_at
	FROM schools
	WHERE id = $1
	`

	var school School
	err := h.db.QueryRow(ctx, query, schoolID).Scan(
		&school.ID,
		&school.Name,
		&school.Code,
		&school.DBName,
		&school.Domain,
		&school.LogoURL,
		&school.Timezone,
		&school.Status,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "School not found",
		})
	}

	return c.JSON(school)
}

// UpdateSchool handles PUT /api/v1/schools/:id
func (h *SchoolHandler) UpdateSchool(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	var req UpdateSchoolRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	ctx := context.Background()

	// Build dynamic update query
	updateFields := ""
	args := []interface{}{schoolID}
	argIndex := 2

	if req.Name != "" {
		updateFields += fmt.Sprintf(", name = $%d", argIndex)
		args = append(args, req.Name)
		argIndex++
	}
	if req.Domain != "" {
		updateFields += fmt.Sprintf(", domain = $%d", argIndex)
		args = append(args, req.Domain)
		argIndex++
	}
	if req.LogoURL != "" {
		updateFields += fmt.Sprintf(", logo_url = $%d", argIndex)
		args = append(args, req.LogoURL)
		argIndex++
	}
	if req.Status != "" {
		updateFields += fmt.Sprintf(", status = $%d", argIndex)
		args = append(args, req.Status)
		argIndex++
	}

	if updateFields == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No fields to update",
		})
	}

	query := fmt.Sprintf(`
	UPDATE schools
	SET updated_at = CURRENT_TIMESTAMP %s
	WHERE id = $1
	RETURNING id, name, code, db_name, domain, logo_url, timezone, status, created_at, updated_at
	`, updateFields)

	var school School
	err := h.db.QueryRow(ctx, query, args...).Scan(
		&school.ID,
		&school.Name,
		&school.Code,
		&school.DBName,
		&school.Domain,
		&school.LogoURL,
		&school.Timezone,
		&school.Status,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "School not found",
		})
	}

	return c.JSON(school)
}

// DeleteSchool handles DELETE /api/v1/schools/:id
func (h *SchoolHandler) DeleteSchool(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	ctx := context.Background()

	// Get school info first
	var code, dbName string
	query := `SELECT code, db_name FROM schools WHERE id = $1`
	err := h.db.QueryRow(ctx, query, schoolID).Scan(&code, &dbName)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "School not found",
		})
	}

	// Delete school record
	deleteQuery := `DELETE FROM schools WHERE id = $1`
	if _, err := h.db.Exec(ctx, deleteQuery, schoolID); err != nil {
		log.Printf("Failed to delete school: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete school",
		})
	}

	// Drop tenant database (async, don't wait)
	go func() {
		if err := h.tenantManager.DropTenantDatabase(context.Background(), h.db, code, dbName); err != nil {
			log.Printf("Failed to drop tenant database: %v\n", err)
		}
	}()

	return c.JSON(fiber.Map{
		"message": "School deleted successfully",
	})
}

// GetSchoolStats handles GET /api/v1/schools/:id/stats
func (h *SchoolHandler) GetSchoolStats(c *fiber.Ctx) error {
	schoolCode := c.Params("code")

	stats := h.tenantManager.GetStats(schoolCode)
	if stats == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "School not found or not connected",
		})
	}

	return c.JSON(fiber.Map{
		"school_code": schoolCode,
		"stats":       stats,
	})
}

// UploadLogo handles POST /api/v1/schools/upload-logo
func (h *SchoolHandler) UploadLogo(c *fiber.Ctx) error {
	// Get the uploaded file
	file, err := c.FormFile("logo")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file uploaded",
		})
	}

	// Validate file type
	ext := filepath.Ext(file.Filename)
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !allowedExts[ext] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid file type. Allowed: jpg, jpeg, png, gif, webp",
		})
	}

	// Validate file size (5MB)
	if file.Size > 5*1024*1024 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File size exceeds 5MB",
		})
	}

	// Create uploads directory if it doesn't exist
	uploadsDir := "/app/uploads"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		log.Printf("Failed to create uploads directory: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create uploads directory",
		})
	}

	// Generate unique filename
	filename := fmt.Sprintf("school-logo-%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadsDir, filename)

	// Save the file
	if err := c.SaveFile(file, filePath); err != nil {
		log.Printf("Failed to save file: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	// Return the URL
	url := fmt.Sprintf("/uploads/%s", filename)
	return c.JSON(fiber.Map{
		"url": url,
	})
}

// generateRandomPassword generates a secure random password
func generateRandomPassword(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		log.Printf("Failed to generate random password: %v\n", err)
		return "defaultPassword123!" // Fallback
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length]
}
