package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"school-erp/auth/config"
	"school-erp/auth/database"
	"school-erp/auth/messaging"
	"school-erp/auth/pkg/logger"
	"school-erp/auth/pkg/monitoring"
	"school-erp/auth/utils"
)

type AuthHandler struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
	SchoolID  int64  `json:"school_id" validate:"required"`
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
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Role      string    `json:"role"`
	SchoolID  int64     `json:"school_id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

func NewAuthHandler(db *pgxpool.Pool, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		db:  db,
		cfg: cfg,
	}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Hash password
	hashedPassword, err := utils.GeneratePasswordHash(h.cfg, req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process password",
		})
	}

	// Insert user
	var userID int64
	err = h.db.QueryRow(
		c.Context(),
		`INSERT INTO users (school_id, email, password_hash, first_name, last_name, role, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id`,
		req.SchoolID, req.Email, hashedPassword, req.FirstName, req.LastName, req.Role, "active",
	).Scan(&userID)

	if err != nil {
		if err.Error() == "duplicate key value violates unique constraint \"users_school_id_email_key\"" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already registered",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to register user",
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
	if err := h.storeRefreshToken(c.Context(), userID, tokens.RefreshToken); err != nil {
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
	if err := h.logAudit(c.Context(), userID, "REGISTER", "user", c.IP()); err != nil {
		// Log error but don't fail request
		logger.ErrorLog("handlers", err, "Failed to log audit for user registration")
	}

	// Also log to structured logger
	logger.AuditLog(userID, "REGISTER", "user", c.IP(), true, nil)

	// Record metrics
	monitoring.GetMetrics().RecordRegistration()

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registered successfully",
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

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Find user
	var user database.User
	err := h.db.QueryRow(
		c.Context(),
		`SELECT id, school_id, email, password_hash, first_name, last_name, role, status
		 FROM users WHERE email = $1`,
		req.Email,
	).Scan(
		&user.ID, &user.SchoolID, &user.Email, &user.PasswordHash,
		&user.FirstName, &user.LastName, &user.Role, &user.Status,
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

	// Check status
	if user.Status != "active" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "User account is not active",
		})
	}

	// Verify password
	if err := utils.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		monitoring.GetMetrics().RecordLoginAttempt(false)
		logger.SecurityLog("failed_login", user.ID, c.IP(), map[string]interface{}{
			"email": req.Email,
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	// Generate tokens
	tokens, err := utils.GenerateTokens(h.cfg, user.ID, user.Email, user.Role, user.SchoolID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	// Store refresh token
	if err := h.storeRefreshToken(c.Context(), user.ID, tokens.RefreshToken); err != nil {
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

	// Log audit
	if err := h.logAudit(c.Context(), user.ID, "LOGIN", "user", c.IP()); err != nil {
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
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Role:      user.Role,
			SchoolID:  user.SchoolID,
			Status:    user.Status,
			CreatedAt: user.CreatedAt,
		},
		"tokens": fiber.Map{
			"accessToken": tokens.AccessToken,
		},
	})
}

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
			"error": "Invalid refresh token",
		})
	}

	// Get user from database to get fresh data
	var user database.User
	err = h.db.QueryRow(
		c.Context(),
		`SELECT id, school_id, email, first_name, last_name, role, status FROM users WHERE id = $1`,
		claims.Subject,
	).Scan(
		&user.ID, &user.SchoolID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.Status,
	)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not found",
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
	if err := h.storeRefreshToken(c.Context(), user.ID, tokens.RefreshToken); err != nil {
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

func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	// Extract user from context (set by middleware)
	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Get user from database
	var user database.User
	err := h.db.QueryRow(
		c.Context(),
		`SELECT id, school_id, email, first_name, last_name, role, status, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(
		&user.ID, &user.SchoolID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.Status, &user.CreatedAt,
	)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(fiber.Map{
		"message": "User retrieved successfully",
		"data": UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Role:      user.Role,
			SchoolID:  user.SchoolID,
			Status:    user.Status,
			CreatedAt: user.CreatedAt,
		},
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Revoke all refresh tokens for the user
	_, err := h.db.Exec(
		c.Context(),
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
		userID,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to logout",
		})
	}

	if err := h.logAudit(c.Context(), userID, "LOGOUT", "user", c.IP()); err != nil {
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

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

func (h *AuthHandler) storeRefreshToken(ctx context.Context, userID int64, token string) error {
	expiresAt := time.Now().Add(h.cfg.RefreshTokenExpiry)
	_, err := h.db.Exec(
		ctx,
		`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
		userID, token, expiresAt,
	)
	return err
}

func (h *AuthHandler) logAudit(ctx context.Context, userID int64, action, resource, ipAddress string) error {
	_, err := h.db.Exec(
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
			Int64("user_id", userID).
			Str("action", action).
			Str("resource", resource).
			Str("ip", ipAddress).
			Msg("CRITICAL: Audit log database insert failed")

		// Also log as security event
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
