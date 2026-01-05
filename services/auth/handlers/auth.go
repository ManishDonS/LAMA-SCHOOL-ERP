package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/auth/config"
	"school-erp/auth/database"
	"school-erp/auth/messaging"
	"school-erp/auth/middleware"
	"school-erp/auth/pkg/cache"
	"school-erp/auth/pkg/casbin"
	"school-erp/auth/pkg/logger"
	"school-erp/auth/pkg/monitoring"
	"school-erp/auth/utils"
)

type AuthHandler struct {
	db    *pgxpool.Pool
	cfg   *config.Config
	cache *cache.RedisCache
}

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
	SchoolID  string `json:"school_id" validate:"required"`
	Role      string `json:"role" validate:"required,oneof=admin teacher student parent staff"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type UserResponse struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Role        string    `json:"role"`
	SchoolID    string    `json:"school_id"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	Permissions []string  `json:"permissions"`
}

func NewAuthHandler(db *pgxpool.Pool, cfg *config.Config, cache *cache.RedisCache) *AuthHandler {
	return &AuthHandler{
		db:    db,
		cfg:   cfg,
		cache: cache,
	}
}

// Register godoc
// @Summary Register a new user
// @Description Register a new user (admin, teacher, student, parent, staff)
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration Request"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Normalize email
	req.Email = strings.ToLower(req.Email)

	// Hash password
	// Hash password
	hashedPassword, err := utils.GeneratePasswordHash(h.cfg, req.Password)
	if err != nil {
		// Check for complexity error
		if complexityErr, ok := err.(*utils.PasswordComplexityError); ok {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": complexityErr.Message,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process password",
		})
	}

	// Insert user
	var userID string
	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	err = tenantDB.QueryRow(
		c.Context(),
		`INSERT INTO users (school_id, email, password_hash, first_name, last_name, role, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id`,
		req.SchoolID, req.Email, hashedPassword, req.FirstName, req.LastName, req.Role, "active",
	).Scan(&userID)

	if err == nil {
		// Assign role in user_roles table
		// Find role ID first
		var roleID string
		errRole := tenantDB.QueryRow(c.Context(), "SELECT id FROM roles WHERE name = $1", req.Role).Scan(&roleID)
		if errRole == nil {
			_, errRoleAssign := tenantDB.Exec(c.Context(), "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", userID, roleID)
			if errRoleAssign != nil {
				logger.ErrorLog("handlers", errRoleAssign, "Failed to assign role to user")
				// Non-fatal, but user won't have permissions via RBAC until fixed/migrated
			} else {
				// Successfully assigned in DB, now sync to Casbin
				if casbin.Enforcer != nil {
					// Add user-role grouping policy: g(sub, role, dom)
					_, err := casbin.Enforcer.AddNamedGroupingPolicy("g", userID, req.Role, req.SchoolID)
					if err != nil {
						logger.ErrorLog("handlers", err, "Failed to add Casbin grouping policy")
					}
					// If super_admin, also add to system domain
					if req.Role == "super_admin" {
						casbin.Enforcer.AddNamedGroupingPolicy("g", userID, req.Role, "system")
					}
					// Auto-save is likely enabled, but we can explicitly save if needed or just rely on LoadPolicy on restart
					casbin.Enforcer.SavePolicy()
				}
			}
		} else {
			logger.ErrorLog("handlers", errRole, "Failed to find role for assignment: "+req.Role)
		}
	}

	if err != nil {
		logger.ErrorLog("handlers", err, "Failed to register user to database")
		if err.Error() == "duplicate key value violates unique constraint \"users_school_id_email_key\"" {
			// To prevent user enumeration, we return a success message even if the user exists.
			// In a full production system, we would then trigger a "you tried to register" email.
			return c.Status(fiber.StatusCreated).JSON(fiber.Map{
				"message": "User registration successful. If this email is not already registered, you will receive a confirmation.",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to register user",
			"details": err.Error(),
		})
	}

	// Generate tokens
	tokens, err := utils.GenerateTokens(h.cfg, userID, req.Email, req.Role, req.SchoolID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	// Store refresh token in database
	if err := h.storeRefreshToken(c.Context(), userID, tokens.RefreshToken, tenantDB); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to store token",
		})
	}

	// Set refresh token in HttpOnly cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		Expires:  time.Now().Add(h.cfg.RefreshTokenExpiry),
		HTTPOnly: true,
		Secure:   h.cfg.Environment == "production",
		SameSite: "Strict",
		Path:     "/api/v1/auth/refresh",
	})

	// Publish UserRegistered event
	if messaging.NatsConnection != nil {
		eventData := fiber.Map{
			"user_id":    userID,
			"email":      req.Email,
			"first_name": req.FirstName,
			"last_name":  req.LastName,
			"role":       req.Role,
			"school_id":  req.SchoolID,
			"status":     "active",
		}

		// Convert to JSON
		jsonBytes, err := json.Marshal(eventData)
		if err != nil {
			// Log error but don't fail request
			logger.ErrorLog("handlers", err, "Failed to marshal UserRegistered event")
		} else {
			if err := messaging.NatsConnection.Publish("UserRegistered", jsonBytes); err != nil {
				// Log error but don't fail request
				logger.ErrorLog("handlers", err, "Failed to publish UserRegistered event")
			}
		}
	}

	// Log audit
	if err := h.logAudit(c.Context(), userID, "REGISTER", "user", c.IP(), tenantDB); err != nil {
		// Log error but don't fail request
		logger.ErrorLog("handlers", err, "Failed to log audit for user registration")
	}

	// Also log to structured logger
	logger.AuditLog(userID, "REGISTER", "user", c.IP(), true, nil)

	// Record metrics
	monitoring.GetMetrics().RecordRegistration()

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registration successful. If this email is not already registered, you will receive a confirmation.",
		"data": fiber.Map{
			"user_id": userID,
			"email":   req.Email,
		},
		"tokens": fiber.Map{
			"accessToken": tokens.AccessToken,
			// Refresh token is now in cookie
		},
	})
}

// Login godoc
// @Summary Login user
// @Description Authenticate a user and return access token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login Request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Normalize email
	req.Email = strings.ToLower(req.Email)

	// Find user
	var user database.User
	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	err := tenantDB.QueryRow(
		c.Context(),
		`SELECT id, COALESCE(school_id::text, ''), email, password_hash, first_name, last_name, role, status, 
		        failed_login_attempts, locked_until
		 FROM users WHERE email = $1`,
		req.Email,
	).Scan(
		&user.ID, &user.SchoolID, &user.Email, &user.PasswordHash,
		&user.FirstName, &user.LastName, &user.Role, &user.Status,
		&user.FailedLoginAttempts, &user.LockedUntil,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid email or password",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database error",
		})
	}

	// Check lockout
	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": fmt.Sprintf("Account is locked due to multiple failed attempts. Please try again after %v", user.LockedUntil.Format("15:04:05")),
		})
	}

	// Check status
	if user.Status != "active" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "User account is not active",
		})
	}

	// Verify password
	if err := utils.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		// Increment failed attempts
		failedAttempts := user.FailedLoginAttempts + 1
		var lockedUntil *time.Time

		if failedAttempts >= 5 {
			// Lock for 15 minutes
			t := time.Now().Add(15 * time.Minute)
			lockedUntil = &t
		}

		_, updateErr := tenantDB.Exec(c.Context(),
			"UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3",
			failedAttempts, lockedUntil, user.ID)
		if updateErr != nil {
			logger.ErrorLog("handlers", updateErr, "Failed to update login attempts")
		}

		monitoring.GetMetrics().RecordLoginAttempt(false)
		logger.SecurityLog("failed_login", user.ID, c.IP(), map[string]interface{}{
			"email":    req.Email,
			"attempts": failedAttempts,
		})

		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	// Reset failed attempts on success
	if user.FailedLoginAttempts > 0 {
		_, _ = tenantDB.Exec(c.Context(), "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1", user.ID)
	}

	// Generate tokens
	tokens, err := utils.GenerateTokens(h.cfg, user.ID, user.Email, user.Role, user.SchoolID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	// Store refresh token
	if err := h.storeRefreshToken(c.Context(), user.ID, tokens.RefreshToken, tenantDB); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to store token",
		})
	}

	// Set refresh token in HttpOnly cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		Expires:  time.Now().Add(h.cfg.RefreshTokenExpiry),
		HTTPOnly: true,
		Secure:   h.cfg.Environment == "production",
		SameSite: "Strict",
		Path:     "/api/v1/auth/refresh",
	})

	// Fetch permissions using Casbin
	domain := user.SchoolID
	if domain == "" {
		domain = "system"
	}
	permissions := casbin.GetUserPermissions(user.ID, domain)

	// Log audit
	if err := h.logAudit(c.Context(), user.ID, "LOGIN", "user", c.IP(), tenantDB); err != nil {
		// Log error but don't fail request
		logger.ErrorLog("handlers", err, "Failed to log audit for user login")
	}

	// Also log to structured logger
	logger.AuditLog(user.ID, "LOGIN", "user", c.IP(), true, nil)

	// Record metrics
	monitoring.GetMetrics().RecordLoginAttempt(true)

	return c.JSON(fiber.Map{
		"message": "Login successful",
		"data": UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			FirstName:   user.FirstName,
			LastName:    user.LastName,
			Role:        user.Role,
			SchoolID:    user.SchoolID,
			Status:      user.Status,
			CreatedAt:   user.CreatedAt,
			Permissions: permissions,
		},
		"tokens": fiber.Map{
			"accessToken": tokens.AccessToken,
		},
	})
}

// RefreshToken godoc
// @Summary Refresh access token
// @Description Get a new access token using a refresh token (cookie or body)
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RefreshTokenRequest false "Refresh Token (Optional if cookie is set)"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /refresh [post]
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	// Get refresh token from cookie
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		// Fallback to body for backward compatibility (optional)
		var req RefreshTokenRequest
		if err := c.BodyParser(&req); err == nil && req.RefreshToken != "" {
			refreshToken = req.RefreshToken
		}
	}

	if refreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Refresh token required",
		})
	}

	// Verify refresh token
	claims, err := utils.VerifyRefreshToken(h.cfg, refreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Session expired or invalid. Please login again.",
		})
	}

	// Get user from database to get fresh data
	var user database.User
	var revokedAt *time.Time
	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	// Hash the refresh token to compare with stored hash
	tokenHash := utils.HashRefreshToken(refreshToken)

	err = tenantDB.QueryRow(
		c.Context(),
		`SELECT u.id, COALESCE(u.school_id::text, ''), u.email, u.first_name, u.last_name, u.role, u.status,
		        rt.revoked_at
		 FROM users u
		 LEFT JOIN refresh_tokens rt ON u.id = rt.user_id AND rt.token_hash = $2
		 WHERE u.id = $1`,
		claims.Subject, tokenHash,
	).Scan(
		&user.ID, &user.SchoolID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.Status,
		&revokedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User session no longer valid",
			})
		}
		logger.ErrorLog("handlers", err, "Database error during token refresh")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	// Check if token was revoked
	if revokedAt != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "This session has been revoked. Please login again.",
		})
	}

	// Check status
	if user.Status != "active" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "User account is no longer active",
		})
	}

	// Generate new tokens
	tokens, err := utils.GenerateTokens(h.cfg, user.ID, user.Email, user.Role, user.SchoolID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	// Store new refresh token
	if err := h.storeRefreshToken(c.Context(), user.ID, tokens.RefreshToken, tenantDB); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to store token",
		})
	}

	// Set new refresh token in HttpOnly cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		Expires:  time.Now().Add(h.cfg.RefreshTokenExpiry),
		HTTPOnly: true,
		Secure:   h.cfg.Environment == "production",
		SameSite: "Strict",
		Path:     "/api/v1/auth/refresh",
	})

	return c.JSON(fiber.Map{
		"message": "Token refreshed successfully",
		"tokens": fiber.Map{
			"accessToken": tokens.AccessToken,
		},
	})
}

// GetMe godoc
// @Summary Get current user
// @Description Get details of the currently authenticated user
// @Tags auth
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} UserResponse
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /me [get]
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	// Extract user from context (set by middleware)
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Get user from database
	var user database.User
	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	err := tenantDB.QueryRow(
		c.Context(),
		`SELECT id, COALESCE(school_id::text, ''), email, first_name, last_name, role, status, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(
		&user.ID, &user.SchoolID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.Status, &user.CreatedAt,
	)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	// Fetch permissions using Casbin
	domain := user.SchoolID
	if domain == "" {
		domain = "system"
	}
	permissions := casbin.GetUserPermissions(user.ID, domain)

	return c.JSON(fiber.Map{
		"message": "User retrieved successfully",
		"data": UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			FirstName:   user.FirstName,
			LastName:    user.LastName,
			Role:        user.Role,
			SchoolID:    user.SchoolID,
			Status:      user.Status,
			CreatedAt:   user.CreatedAt,
			Permissions: permissions,
		},
	})
}

// Logout godoc
// @Summary Logout user
// @Description Revoke access by invalidating refresh token and clearing cookies
// @Tags auth
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /logout [post]
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Revoke all refresh tokens for the user
	tenantDB := middleware.GetTenantDB(c)
	if tenantDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to connect to tenant database",
		})
	}

	_, err := tenantDB.Exec(
		c.Context(),
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
		userID,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to logout",
		})
	}

	if err := h.logAudit(c.Context(), userID, "LOGOUT", "user", c.IP(), tenantDB); err != nil {
		// Log error but don't fail request
		logger.ErrorLog("handlers", err, "Failed to log audit for user logout")
	}

	// Also log to structured logger
	logger.AuditLog(userID, "LOGOUT", "user", c.IP(), true, nil)

	// Record metrics
	monitoring.GetMetrics().RecordLogout()

	// Clear refresh token cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour), // Expire immediately
		HTTPOnly: true,
		Secure:   h.cfg.Environment == "production",
		SameSite: "Strict",
		Path:     "/api/v1/auth/refresh",
	})

	// Blacklist the current access token's JTI
	jti, _ := c.Locals("jti").(string)
	exp, _ := c.Locals("exp").(time.Time)
	if h.cache != nil && jti != "" && !exp.IsZero() {
		remainingTTL := time.Until(exp)
		if remainingTTL > 0 {
			if err := h.cache.BlacklistJTI(c.Context(), jti, remainingTTL); err != nil {
				logger.ErrorLog("handlers", err, "Failed to blacklist token")
			}
		}
	}

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

func (h *AuthHandler) storeRefreshToken(ctx context.Context, userID string, token string, db *pgxpool.Pool) error {
	// Hash the refresh token before storing for security
	// This protects against database breaches, backup theft, and insider threats
	tokenHash := utils.HashRefreshToken(token)

	expiresAt := time.Now().Add(h.cfg.RefreshTokenExpiry)
	_, err := db.Exec(
		ctx,
		`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
		userID, tokenHash, expiresAt,
	)
	return err
}

func (h *AuthHandler) logAudit(ctx context.Context, userID string, action, resource, ipAddress string, db *pgxpool.Pool) error {
	_, err := db.Exec(
		ctx,
		`INSERT INTO audit_logs (user_id, action, resource, ip_address) VALUES ($1, $2, $3, $4)`,
		userID, action, resource, ipAddress,
	)
	if err != nil {
		// Record metric
		monitoring.GetMetrics().RecordAuditLogFailure()

		// Log the error for monitoring using structured logger
		logger.Logger.Error().
			Err(err).
			Str("user_id", userID).
			Str("action", action).
			Str("resource", resource).
			Str("ip", ipAddress).
			Msg("CRITICAL: Audit log database insert failed")

		logger.SecurityLog("audit_failure", userID, ipAddress, map[string]interface{}{
			"action":   action,
			"resource": resource,
			"error":    err.Error(),
		})
	} else {
		// Record successful audit log
		monitoring.GetMetrics().RecordAuditLogSuccess()
	}
	return err
}
