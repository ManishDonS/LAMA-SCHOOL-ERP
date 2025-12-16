package handlers

import (
	"context"
	"encoding/json"
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
	db            *pgxpool.Pool
	tenantManager *tenant.TenantManager
	validator     *validator.Validate
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
// School represents the school model in response
type School struct {
	ID            string    `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	Code          string    `json:"code" db:"code"`
	Domain        string    `json:"domain" db:"domain"`
	LogoURL       string    `json:"logo_url" db:"logo_url"`
	Timezone      string    `json:"timezone" db:"timezone"`
	DBName        string    `json:"db_name" db:"db_name"`
	DBUser        string    `json:"db_user" db:"db_user"`
	DBPassword    string    `json:"-" db:"db_password"` // Never expose
	DBHost        string    `json:"db_host" db:"db_host"`
	DBPort        int       `json:"db_port" db:"db_port"`
	Email         string    `json:"email" db:"email"`
	Phone         string    `json:"phone" db:"phone"`
	Address       string    `json:"address" db:"address"`
	City          string    `json:"city" db:"city"`
	State         string    `json:"state" db:"state"`
	Country       string    `json:"country" db:"country"`
	Pincode       string    `json:"pincode" db:"pincode"`
	Website       string    `json:"website" db:"website"`
	Status        string    `json:"status" db:"status"`
	ActiveModules []string  `json:"active_modules" db:"active_modules"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// CreateSchoolRequest is the request body for creating a school
// CreateSchoolRequest is the request body for creating a school
type CreateSchoolRequest struct {
	Name       string `json:"name" validate:"required,min=2,max=255"`
	Code       string `json:"code" validate:"required,min=2,max=20"` // Removed strictly alphanumeric to allow hyphens/underscores
	Domain     string `json:"domain" validate:"required"`
	LogoURL    string `json:"logo_url" validate:"omitempty"` // Removed url tag to allow relative paths from uploads
	Timezone   string `json:"timezone" validate:"required"`
	DBUser     string `json:"db_user" validate:"omitempty"`
	DBPassword string `json:"db_password" validate:"omitempty"`
	Email      string `json:"email" validate:"omitempty,email"`
	Phone      string `json:"phone" validate:"omitempty"`
	Address    string `json:"address" validate:"omitempty"`
	City       string `json:"city" validate:"omitempty"`
	State      string `json:"state" validate:"omitempty"`
	Country    string `json:"country" validate:"omitempty"`
	Pincode    string `json:"pincode" validate:"omitempty"`
	Website    string `json:"website" validate:"omitempty"`
}

// UpdateSchoolRequest is the request body for updating a school
// UpdateSchoolRequest is the request body for updating a school
type UpdateSchoolRequest struct {
	Name     string `json:"name" validate:"omitempty,min=2,max=255"`
	Domain   string `json:"domain" validate:"omitempty"`
	LogoURL  string `json:"logo_url" validate:"omitempty,url"`
	Timezone string `json:"timezone" validate:"omitempty"`
	Email    string `json:"email" validate:"omitempty,email"`
	Phone    string `json:"phone" validate:"omitempty"`
	Address  string `json:"address" validate:"omitempty"`
	City     string `json:"city" validate:"omitempty"`
	State    string `json:"state" validate:"omitempty"`
	Country  string `json:"country" validate:"omitempty"`
	Pincode  string `json:"pincode" validate:"omitempty"`
	Website  string `json:"website" validate:"omitempty"`
	Status   string `json:"status" validate:"omitempty,oneof=active inactive suspended"`
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
		log.Printf("CreateSchool validation failed: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	ctx := context.Background()

	// Insert school record in main database
	query := `
	INSERT INTO schools (name, code, domain, logo_url, timezone, db_name, db_user, db_password, email, phone, address, city, state, country, pincode, website, status, active_modules)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, '[]'::jsonb)
	RETURNING id, name, code, domain, COALESCE(logo_url, ''), timezone, db_name, db_user, 
	          COALESCE(email, ''), COALESCE(phone, ''), COALESCE(address, ''),
	          COALESCE(city, ''), COALESCE(state, ''), COALESCE(country, ''),
	          COALESCE(pincode, ''), COALESCE(website, ''), status, active_modules, created_at, updated_at
	`

	// Auto-generate DB fields if not provided
	dbName := fmt.Sprintf("school_%s_db", req.Code)
	dbUser := req.DBUser
	if dbUser == "" {
		dbUser = fmt.Sprintf("school_%s_user", req.Code)
	}
	// In a real app, generate a secure random password if empty
	dbPassword := req.DBPassword
	if dbPassword == "" {
		dbPassword = fmt.Sprintf("pass_%s_%d", req.Code, time.Now().Unix())
	}

	var school School
	var activeModulesJSON []byte
	err := h.db.QueryRow(ctx, query,
		req.Name,
		req.Code,
		req.Domain,
		req.LogoURL,
		req.Timezone,
		dbName,
		dbUser,
		dbPassword,
		req.Email,
		req.Phone,
		req.Address,
		req.City,
		req.State,
		req.Country,
		req.Pincode,
		req.Website,
		"active",
	).Scan(
		&school.ID,
		&school.Name,
		&school.Code,
		&school.Domain,
		&school.LogoURL,
		&school.Timezone,
		&school.DBName,
		&school.DBUser,
		&school.Email,
		&school.Phone,
		&school.Address,
		&school.City,
		&school.State,
		&school.Country,
		&school.Pincode,
		&school.Website,
		&school.Status,
		&activeModulesJSON,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	// Parse JSONB to slice
	if len(activeModulesJSON) > 0 {
		json.Unmarshal(activeModulesJSON, &school.ActiveModules)
	} else {
		school.ActiveModules = []string{}
	}

	if err != nil {
		log.Printf("Failed to insert school: %v\n", err)
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
	SELECT id, name, COALESCE(code, ''), COALESCE(domain, ''), COALESCE(logo_url, ''), COALESCE(timezone, ''), COALESCE(db_name, ''), COALESCE(db_user, ''), 
	       COALESCE(email, ''), COALESCE(phone, ''), COALESCE(address, ''), 
	       COALESCE(city, ''), COALESCE(state, ''), COALESCE(country, ''), 
	       COALESCE(pincode, ''), COALESCE(website, ''), status, active_modules, created_at, updated_at
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
		var activeModulesJSON []byte
		if err := rows.Scan(
			&school.ID,
			&school.Name,
			&school.Code,
			&school.Domain,
			&school.LogoURL,
			&school.Timezone,
			&school.DBName,
			&school.DBUser,
			&school.Email,
			&school.Phone,
			&school.Address,
			&school.City,
			&school.State,
			&school.Country,
			&school.Pincode,
			&school.Website,
			&school.Status,
			&activeModulesJSON,
			&school.CreatedAt,
			&school.UpdatedAt,
		); err != nil {
			log.Printf("Failed to scan school: %v\n", err)
			continue
		}
		if len(activeModulesJSON) > 0 {
			json.Unmarshal(activeModulesJSON, &school.ActiveModules)
		} else {
			school.ActiveModules = []string{}
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
	SELECT id, name, COALESCE(code, ''), COALESCE(domain, ''), COALESCE(logo_url, ''), COALESCE(timezone, ''), COALESCE(db_name, ''), COALESCE(db_user, ''), 
	       COALESCE(email, ''), COALESCE(phone, ''), COALESCE(address, ''), 
	       COALESCE(city, ''), COALESCE(state, ''), COALESCE(country, ''), 
	       COALESCE(pincode, ''), COALESCE(website, ''), status, active_modules, created_at, updated_at
	FROM schools
	WHERE id = $1
	`

	var school School
	var activeModulesJSON []byte
	err := h.db.QueryRow(ctx, query, schoolID).Scan(
		&school.ID,
		&school.Name,
		&school.Code,
		&school.Domain,
		&school.LogoURL,
		&school.Timezone,
		&school.DBName,
		&school.DBUser,
		&school.Email,
		&school.Phone,
		&school.Address,
		&school.City,
		&school.State,
		&school.Country,
		&school.Pincode,
		&school.Website,
		&school.Status,
		&activeModulesJSON,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if len(activeModulesJSON) > 0 {
		json.Unmarshal(activeModulesJSON, &school.ActiveModules)
	} else {
		school.ActiveModules = []string{}
	}

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
	if req.Timezone != "" {
		updateFields += fmt.Sprintf(", timezone = $%d", argIndex)
		args = append(args, req.Timezone)
		argIndex++
	}
	if req.Email != "" {
		updateFields += fmt.Sprintf(", email = $%d", argIndex)
		args = append(args, req.Email)
		argIndex++
	}
	if req.Phone != "" {
		updateFields += fmt.Sprintf(", phone = $%d", argIndex)
		args = append(args, req.Phone)
		argIndex++
	}
	if req.Address != "" {
		updateFields += fmt.Sprintf(", address = $%d", argIndex)
		args = append(args, req.Address)
		argIndex++
	}
	if req.City != "" {
		updateFields += fmt.Sprintf(", city = $%d", argIndex)
		args = append(args, req.City)
		argIndex++
	}
	if req.State != "" {
		updateFields += fmt.Sprintf(", state = $%d", argIndex)
		args = append(args, req.State)
		argIndex++
	}
	if req.Country != "" {
		updateFields += fmt.Sprintf(", country = $%d", argIndex)
		args = append(args, req.Country)
		argIndex++
	}
	if req.Pincode != "" {
		updateFields += fmt.Sprintf(", pincode = $%d", argIndex)
		args = append(args, req.Pincode)
		argIndex++
	}
	if req.Website != "" {
		updateFields += fmt.Sprintf(", website = $%d", argIndex)
		args = append(args, req.Website)
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
	RETURNING id, name, code, domain, COALESCE(logo_url, ''), timezone, db_name, db_user, 
	          COALESCE(email, ''), COALESCE(phone, ''), COALESCE(address, ''),
	          COALESCE(city, ''), COALESCE(state, ''), COALESCE(country, ''),
	          COALESCE(pincode, ''), COALESCE(website, ''), status, active_modules, created_at, updated_at
	`, updateFields)

	var school School
	var activeModulesJSON []byte
	err := h.db.QueryRow(ctx, query, args...).Scan(
		&school.ID,
		&school.Name,
		&school.Code,
		&school.Domain,
		&school.LogoURL,
		&school.Timezone,
		&school.DBName,
		&school.DBUser,
		&school.Email,
		&school.Phone,
		&school.Address,
		&school.City,
		&school.State,
		&school.Country,
		&school.Pincode,
		&school.Website,
		&school.Status,
		&activeModulesJSON,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if len(activeModulesJSON) > 0 {
		json.Unmarshal(activeModulesJSON, &school.ActiveModules)
	} else {
		school.ActiveModules = []string{}
	}

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

	// Soft delete school record (set status to suspended)
	log.Printf("Attempting to soft delete school with ID: %s", schoolID)
	deleteQuery := `UPDATE schools SET status = 'suspended', updated_at = NOW() WHERE id = $1`
	result, err := h.db.Exec(ctx, deleteQuery, schoolID)
	if err != nil {
		log.Printf("Failed to delete school (SQL Error): %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to delete school: %v", err),
		})
	}

	// Check if any rows were affected
	if result.RowsAffected() == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "School not found",
		})
	}

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
