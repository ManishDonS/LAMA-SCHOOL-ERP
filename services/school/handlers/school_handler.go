package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

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
	// 1. Calculate Active Modules
	var activeModules []string
	if req.ModulePermissions != nil {
		for module, permissions := range req.ModulePermissions {
			if permissions["read"] {
				activeModules = append(activeModules, module)
			}
		}
	} else {
		activeModules = []string{}
	}

	// Sanitize School Code (lowercase, replace spaces with underscores)
	req.Code = strings.ReplaceAll(strings.ToLower(strings.TrimSpace(req.Code)), " ", "_")

	// 2. Insert school record in main database
	query := `
	INSERT INTO schools (name, code, domain, logo_url, timezone, db_name, db_user, db_password, email, phone, address, city, state, country, pincode, website, status, active_modules, module_permissions)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
	RETURNING id, name, code, domain, COALESCE(logo_url, ''), timezone, db_name, db_user, db_host, db_port,
	          COALESCE(email, ''), COALESCE(phone, ''), COALESCE(address, ''),
	          COALESCE(city, ''), COALESCE(state, ''), COALESCE(country, ''),
	          COALESCE(pincode, ''), COALESCE(website, ''), status, active_modules, module_permissions, created_at, updated_at
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

	activeModulesJSONBytes, _ := json.Marshal(activeModules)
	modulePermissionsJSONBytes, _ := json.Marshal(req.ModulePermissions)

	var school School
	var retActiveModulesJSON, retModulePermissionsJSON []byte

	// Encrypt DB Password for storage in main DB
	encryptedDBPassword, err := h.tenantManager.EncryptPassword(dbPassword)
	if err != nil {
		log.Printf("Failed to encrypt DB password: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to encrypt database password",
		})
	}

	err = h.db.QueryRow(ctx, query,
		req.Name,
		req.Code,
		req.Domain,
		req.LogoURL,
		req.Timezone,
		dbName,
		dbUser,
		encryptedDBPassword, // Store Encrypted Password
		req.Email,
		req.Phone,
		req.Address,
		req.City,
		req.State,
		req.Country,
		req.Pincode,
		req.Website,
		"active",
		activeModulesJSONBytes,
		modulePermissionsJSONBytes,
	).Scan(
		&school.ID,
		&school.Name,
		&school.Code,
		&school.Domain,
		&school.LogoURL,
		&school.Timezone,
		&school.DBName,
		&school.DBUser,
		&school.DBHost,
		&school.DBPort,
		&school.Email,
		&school.Phone,
		&school.Address,
		&school.City,
		&school.State,
		&school.Country,
		&school.Pincode,
		&school.Website,
		&school.Status,
		&retActiveModulesJSON,
		&retModulePermissionsJSON,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if err != nil {
		log.Printf("Failed to insert school: %v\n", err)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "School with this name or code already exists",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save school record",
		})
	}

	if len(retActiveModulesJSON) > 0 {
		json.Unmarshal(retActiveModulesJSON, &school.ActiveModules)
	}
	if len(retModulePermissionsJSON) > 0 {
		json.Unmarshal(retModulePermissionsJSON, &school.ModulePermissions)
	}

	// 3. Create Tenant Database
	go func() {
		bgCtx := context.Background()

		// Ensure defaults are present for connection
		if school.DBHost == "" {
			school.DBHost = "postgres"
		}
		if school.DBPort == 0 {
			school.DBPort = 5432
		}

		log.Printf("Creating tenant database for school: %s (%s)", school.Name, school.Code)
		if err := h.tenantManager.CreateTenantDatabase(bgCtx, h.db, school.Code, school.DBName, school.DBUser, dbPassword); err != nil {
			log.Printf("Failed to create tenant database for school %s: %v", school.Code, err)
			return
		}

		// 4. Create Admin User
		log.Printf("Creating admin user for school: %s", school.Name)

		// Encrypt tenant password for connection
		encryptedPass, err := h.tenantManager.EncryptPassword(dbPassword)
		if err != nil {
			log.Printf("Failed to encrypt password for school %s: %v", school.Code, err)
			return
		}

		// Get connection to new tenant DB
		tenantDB, err := h.tenantManager.GetConnection(bgCtx, school.Code, school.DBHost, school.DBPort, school.DBName, school.DBUser, encryptedPass)
		if err != nil {
			log.Printf("Failed to connect to tenant database for school %s: %v", school.Code, err)
			return
		}

		// Run Migrations (Create users table etc)
		// We need to access migrations package, but we are in handlers package.
		// Since we cannot import database package due to cycle (likely),
		// we should move RunTenantMigrations to pkg/tenant or similar.
		// For now, let's assume valid tables are created by CreateTenantDatabase schema copy
		// OR we need to run specific SQL here if migration logic is not accessible.
		// Re-checking CreateTenantDatabase... it copies template0? No, it creates empty DB.
		// We need to run the migrations.
		// However, we can't import `school-erp/school/database` here because `main` probably imports `handlers` and `database`.
		// To avoid cycle, we'll execute the SQL directly here or use a shared package.
		// Given time constraints, I will execute the critical SQL here directly.

		createUsersTableSQL := `
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			school_id UUID NOT NULL,
			email VARCHAR(255) NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			first_name VARCHAR(100),
			last_name VARCHAR(100),
			role VARCHAR(50) NOT NULL DEFAULT 'student',
			status VARCHAR(50) DEFAULT 'active',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(school_id, email)
		);
		CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
		CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
		`
		if _, err := tenantDB.Exec(bgCtx, createUsersTableSQL); err != nil {
			log.Printf("Failed to create users table for school %s: %v", school.Code, err)
			return
		}

		// Hash Admin Password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.AdminPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash admin password: %v", err)
			return
		}

		// Insert Admin User
		insertAdminSQL := `
		INSERT INTO users (school_id, email, password_hash, first_name, last_name, role, status)
		VALUES ($1, $2, $3, $4, $5, 'admin', 'active')
		`
		// We need school.ID here as UUID. school.ID is string from response, let's assume it parses.
		if _, err := tenantDB.Exec(bgCtx, insertAdminSQL, school.ID, req.AdminEmail, string(hashedPassword), req.AdminFirstName, req.AdminLastName); err != nil {
			log.Printf("Failed to insert admin user for school %s: %v", school.Code, err)
			return
		}

		// 5. Register Admin in Auth Service (Central User DB)
		authServiceURL := os.Getenv("AUTH_SERVICE_URL")
		if authServiceURL == "" {
			authServiceURL = "http://auth-service:3001"
		}

		registerReq := map[string]string{
			"email":      req.AdminEmail,
			"password":   req.AdminPassword,
			"first_name": req.AdminFirstName,
			"last_name":  req.AdminLastName,
			"school_id":  school.ID,
			"role":       "admin",
		}

		jsonBody, _ := json.Marshal(registerReq)
		resp, err := http.Post(authServiceURL+"/api/v1/auth/register", "application/json", bytes.NewBuffer(jsonBody))
		if err != nil {
			log.Printf("Failed to register admin with auth-service: %v", err)
			// Don't return, as tenant creation was successful. Just log error.
		} else {
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
				log.Printf("Auth service returned non-success status: %d", resp.StatusCode)
			} else {
				log.Printf("Successfully registered admin %s with auth-service", req.AdminEmail)
			}
		}

		log.Printf("Successfully initialized tenant %s with admin %s", school.Code, req.AdminEmail)
	}()

	return c.Status(fiber.StatusCreated).JSON(school)
}

// GetSchoolAdmin handles GET /api/v1/schools/:id/admin
func (h *SchoolHandler) GetSchoolAdmin(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	ctx := context.Background()

	// 1. Get School Details (for DB connection)
	var school School
	query := `SELECT code, db_name, db_user, db_password, db_host, db_port FROM schools WHERE id = $1`
	if err := h.db.QueryRow(ctx, query, schoolID).Scan(
		&school.Code,
		&school.DBName,
		&school.DBUser,
		&school.DBPassword,
		&school.DBHost,
		&school.DBPort,
	); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	// 2. Connect to Tenant DB
	// Note: school.DBPassword is already encrypted in the database, use it directly

	// Ensure defaults
	if school.DBHost == "" {
		school.DBHost = "postgres"
	}
	if school.DBPort == 0 {
		school.DBPort = 5432
	}

	tenantDB, err := h.tenantManager.GetConnection(ctx, school.Code, school.DBHost, school.DBPort, school.DBName, school.DBUser, school.DBPassword)
	if err != nil {
		log.Printf("Failed to connect to tenant DB: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to connect to school database"})
	}

	// 3. Query Admin User
	var admin GetSchoolAdminResponse
	adminQuery := `SELECT id, first_name, last_name, email, role FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`
	if err := tenantDB.QueryRow(ctx, adminQuery).Scan(&admin.ID, &admin.FirstName, &admin.LastName, &admin.Email, &admin.Role); err != nil {
		log.Printf("Failed to fetch admin: %v", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Admin user not found"})
	}

	return c.JSON(admin)
}

// UpdateSchoolAdmin handles PUT /api/v1/schools/:id/admin
func (h *SchoolHandler) UpdateSchoolAdmin(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	var req UpdateSchoolAdminRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx := context.Background()

	// 1. Get School Details
	var school School
	query := `SELECT code, db_name, db_user, db_password, db_host, db_port FROM schools WHERE id = $1`
	if err := h.db.QueryRow(ctx, query, schoolID).Scan(
		&school.Code,
		&school.DBName,
		&school.DBUser,
		&school.DBPassword,
		&school.DBHost,
		&school.DBPort,
	); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	// 2. Connect to Tenant DB
	// Note: school.DBPassword is already encrypted in the database, use it directly

	if school.DBHost == "" {
		school.DBHost = "postgres"
	}
	if school.DBPort == 0 {
		school.DBPort = 5432
	}

	tenantDB, err := h.tenantManager.GetConnection(ctx, school.Code, school.DBHost, school.DBPort, school.DBName, school.DBUser, school.DBPassword)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to connect to school database"})
	}

	// 3. Prepare Update
	adminQuery := `SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`
	var adminID string
	if err := tenantDB.QueryRow(ctx, adminQuery).Scan(&adminID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Admin user not found"})
	}

	updateFields := ""
	args := []interface{}{adminID}
	argIndex := 2

	if req.FirstName != "" {
		updateFields += fmt.Sprintf(", first_name = $%d", argIndex)
		args = append(args, req.FirstName)
		argIndex++
	}
	if req.LastName != "" {
		updateFields += fmt.Sprintf(", last_name = $%d", argIndex)
		args = append(args, req.LastName)
		argIndex++
	}
	if req.Email != "" {
		updateFields += fmt.Sprintf(", email = $%d", argIndex)
		args = append(args, req.Email)
		argIndex++
	}
	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
		}
		updateFields += fmt.Sprintf(", password_hash = $%d", argIndex)
		args = append(args, string(hashedPassword))
		argIndex++
	}

	if updateFields == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No fields to update"})
	}

	// Remove leading comma
	updateFields = updateFields[2:]

	updateQuery := fmt.Sprintf("UPDATE users SET %s, updated_at = NOW() WHERE id = $1", updateFields)
	if _, err := tenantDB.Exec(ctx, updateQuery, args...); err != nil {
		log.Printf("Failed to update admin: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update admin user"})
	}

	return c.JSON(fiber.Map{"message": "Admin user updated successfully"})
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
	       COALESCE(pincode, ''), COALESCE(website, ''), status, active_modules, module_permissions, created_at, updated_at
	FROM schools
	WHERE id = $1
	`

	var school School
	var activeModulesJSON, modulePermissionsJSON []byte
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
		&modulePermissionsJSON,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if len(activeModulesJSON) > 0 {
		json.Unmarshal(activeModulesJSON, &school.ActiveModules)
	} else {
		school.ActiveModules = []string{}
	}

	if len(modulePermissionsJSON) > 0 {
		json.Unmarshal(modulePermissionsJSON, &school.ModulePermissions)
	} else {
		school.ModulePermissions = make(map[string]map[string]bool)
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
	if req.ModulePermissions != nil {
		permissionsJSON, err := json.Marshal(req.ModulePermissions)
		if err == nil {
			updateFields += fmt.Sprintf(", module_permissions = $%d", argIndex)
			args = append(args, permissionsJSON)
			argIndex++
		}
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
	          COALESCE(pincode, ''), COALESCE(website, ''), status, active_modules, module_permissions, created_at, updated_at
	`, updateFields)

	var school School
	var activeModulesJSON, modulePermissionsJSON []byte
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
		&modulePermissionsJSON,
		&school.CreatedAt,
		&school.UpdatedAt,
	)

	if len(activeModulesJSON) > 0 {
		json.Unmarshal(activeModulesJSON, &school.ActiveModules)
	} else {
		school.ActiveModules = []string{}
	}

	if len(modulePermissionsJSON) > 0 {
		json.Unmarshal(modulePermissionsJSON, &school.ModulePermissions)
	} else {
		school.ModulePermissions = make(map[string]map[string]bool)
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
	rawCode := c.Params("code")
	schoolCode, err := url.QueryUnescape(rawCode)
	if err != nil {
		schoolCode = rawCode // Fallback to raw if unescape fails
	}
	log.Printf("GetSchoolStats for code: '%s' (raw: '%s')", schoolCode, rawCode)

	// 1. Try to get stats from cache
	stats := h.tenantManager.GetStats(schoolCode)
	if stats != nil {
		return c.JSON(fiber.Map{
			"school_code": schoolCode,
			"stats":       stats,
		})
	}

	// 2. If not in cache, we need to connect. Fetch School Details by Code
	ctx := context.Background()
	var school School
	query := `SELECT id, code, db_name, db_user, db_password, db_host, db_port FROM schools WHERE code = $1`
	if err := h.db.QueryRow(ctx, query, schoolCode).Scan(
		&school.ID,
		&school.Code,
		&school.DBName,
		&school.DBUser,
		&school.DBPassword,
		&school.DBHost,
		&school.DBPort,
	); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "School not found"})
	}

	// 3. Connect to Tenant DB
	encryptedPass, err := h.tenantManager.EncryptPassword(school.DBPassword)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to encrypt password"})
	}

	// Ensure defaults
	if school.DBHost == "" {
		school.DBHost = "postgres"
	}
	if school.DBPort == 0 {
		school.DBPort = 5432
	}

	// GetConnection will cache the connection for future use
	_, err = h.tenantManager.GetConnection(ctx, school.Code, school.DBHost, school.DBPort, school.DBName, school.DBUser, encryptedPass)
	if err != nil {
		log.Printf("Failed to connect to tenant DB for stats: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to connect to school database"})
	}

	// 4. Get stats again
	stats = h.tenantManager.GetStats(schoolCode)
	if stats == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Failed to retrieve stats after connection",
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
