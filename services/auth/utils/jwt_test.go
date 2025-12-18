package utils

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"school-erp/auth/config"
)

func getTestConfig() *config.Config {
	return &config.Config{
		JWTSecret:          "test-jwt-secret-key-for-testing",
		JWTRefreshSecret:   "test-refresh-secret-key-for-testing",
		AccessTokenExpiry:  15 * time.Minute,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
	}
}

func TestGenerateTokens(t *testing.T) {
	cfg := getTestConfig()

	tests := []struct {
		name     string
		userID   string
		email    string
		role     string
		schoolID string
		wantErr  bool
	}{
		{
			name:     "Valid user data",
			userID:   "123",
			email:    "user@example.com",
			role:     "admin",
			schoolID: "school-1",
			wantErr:  false,
		},
		{
			name:     "Valid teacher data",
			userID:   "456",
			email:    "teacher@school.com",
			role:     "teacher",
			schoolID: "school-2",
			wantErr:  false,
		},
		{
			name:     "Empty user ID",
			userID:   "",
			email:    "user@example.com",
			role:     "admin",
			schoolID: "school-1",
			wantErr:  false, // JWT generation doesn't validate empty fields
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			response, err := GenerateTokens(cfg, tt.userID, tt.email, tt.role, tt.schoolID)

			if tt.wantErr {
				if err == nil {
					t.Errorf("GenerateTokens() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("GenerateTokens() unexpected error = %v", err)
				return
			}

			// Verify response fields
			if response.AccessToken == "" {
				t.Error("GenerateTokens() returned empty access token")
			}

			if response.RefreshToken == "" {
				t.Error("GenerateTokens() returned empty refresh token")
			}

			if response.TokenType != "Bearer" {
				t.Errorf("GenerateTokens() token type = %v, want Bearer", response.TokenType)
			}

			if response.ExpiresIn != int64(cfg.AccessTokenExpiry.Seconds()) {
				t.Errorf("GenerateTokens() expires_in = %v, want %v",
					response.ExpiresIn, int64(cfg.AccessTokenExpiry.Seconds()))
			}

			// Verify access token can be verified
			claims, err := VerifyToken(cfg, response.AccessToken)
			if err != nil {
				t.Errorf("VerifyToken() failed to verify generated access token: %v", err)
				return
			}

			// Verify claims
			if claims.UserID != tt.userID {
				t.Errorf("Access token UserID = %v, want %v", claims.UserID, tt.userID)
			}
			if claims.Email != tt.email {
				t.Errorf("Access token Email = %v, want %v", claims.Email, tt.email)
			}
			if claims.Role != tt.role {
				t.Errorf("Access token Role = %v, want %v", claims.Role, tt.role)
			}
			if claims.SchoolID != tt.schoolID {
				t.Errorf("Access token SchoolID = %v, want %v", claims.SchoolID, tt.schoolID)
			}
		})
	}
}

func TestVerifyToken(t *testing.T) {
	cfg := getTestConfig()

	// Generate a valid token for testing
	validToken, err := GenerateTokens(cfg, "123", "user@example.com", "admin", "school-1")
	if err != nil {
		t.Fatalf("Setup: failed to generate test token: %v", err)
	}

	// Generate an expired token
	expiredCfg := &config.Config{
		JWTSecret:         cfg.JWTSecret,
		JWTRefreshSecret:  cfg.JWTRefreshSecret,
		AccessTokenExpiry: -1 * time.Hour, // Already expired
	}
	expiredToken, _ := GenerateTokens(expiredCfg, "123", "user@example.com", "admin", "school-1")

	tests := []struct {
		name      string
		token     string
		wantErr   bool
		checkFunc func(*testing.T, *JWTClaims)
	}{
		{
			name:    "Valid token",
			token:   validToken.AccessToken,
			wantErr: false,
			checkFunc: func(t *testing.T, claims *JWTClaims) {
				if claims.UserID != "123" {
					t.Errorf("UserID = %v, want 123", claims.UserID)
				}
				if claims.Email != "user@example.com" {
					t.Errorf("Email = %v, want user@example.com", claims.Email)
				}
				if claims.Role != "admin" {
					t.Errorf("Role = %v, want admin", claims.Role)
				}
			},
		},
		{
			name:    "Expired token",
			token:   expiredToken.AccessToken,
			wantErr: true,
		},
		{
			name:    "Invalid token format",
			token:   "invalid.token.format",
			wantErr: true,
		},
		{
			name:    "Empty token",
			token:   "",
			wantErr: true,
		},
		{
			name:    "Token with wrong signature",
			token:   validToken.AccessToken + "tampered",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := VerifyToken(cfg, tt.token)

			if tt.wantErr {
				if err == nil {
					t.Errorf("VerifyToken() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("VerifyToken() unexpected error = %v", err)
				return
			}

			if tt.checkFunc != nil {
				tt.checkFunc(t, claims)
			}
		})
	}
}

func TestVerifyRefreshToken(t *testing.T) {
	cfg := getTestConfig()

	// Generate a valid refresh token
	validToken, err := GenerateTokens(cfg, "123", "user@example.com", "admin", "school-1")
	if err != nil {
		t.Fatalf("Setup: failed to generate test token: %v", err)
	}

	tests := []struct {
		name    string
		token   string
		wantErr bool
	}{
		{
			name:    "Valid refresh token",
			token:   validToken.RefreshToken,
			wantErr: false,
		},
		{
			name:    "Invalid refresh token",
			token:   "invalid.token.here",
			wantErr: true,
		},
		{
			name:    "Empty token",
			token:   "",
			wantErr: true,
		},
		{
			name:    "Access token instead of refresh token",
			token:   validToken.AccessToken,
			wantErr: true, // Will fail because it's signed with wrong secret
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := VerifyRefreshToken(cfg, tt.token)

			if tt.wantErr {
				if err == nil {
					t.Errorf("VerifyRefreshToken() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("VerifyRefreshToken() unexpected error = %v", err)
				return
			}

			// Verify claims
			if claims.Subject != "123" {
				t.Errorf("Subject = %v, want 123", claims.Subject)
			}
		})
	}
}

func TestTokenExpiration(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:          "test-secret",
		JWTRefreshSecret:   "test-refresh-secret",
		AccessTokenExpiry:  1 * time.Second,  // Very short for testing
		RefreshTokenExpiry: 2 * time.Second,
	}

	// Generate token
	response, err := GenerateTokens(cfg, "123", "user@example.com", "admin", "school-1")
	if err != nil {
		t.Fatalf("Failed to generate tokens: %v", err)
	}

	// Token should be valid immediately
	_, err = VerifyToken(cfg, response.AccessToken)
	if err != nil {
		t.Errorf("Token should be valid immediately after generation: %v", err)
	}

	// Wait for token to expire
	time.Sleep(2 * time.Second)

	// Token should now be expired
	_, err = VerifyToken(cfg, response.AccessToken)
	if err == nil {
		t.Error("Token should be expired after waiting")
	}
}

func TestTokenWithDifferentSecrets(t *testing.T) {
	cfg1 := &config.Config{
		JWTSecret:          "secret-1",
		JWTRefreshSecret:   "refresh-secret-1",
		AccessTokenExpiry:  15 * time.Minute,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
	}

	cfg2 := &config.Config{
		JWTSecret:          "secret-2",
		JWTRefreshSecret:   "refresh-secret-2",
		AccessTokenExpiry:  15 * time.Minute,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
	}

	// Generate token with cfg1
	response, err := GenerateTokens(cfg1, "123", "user@example.com", "admin", "school-1")
	if err != nil {
		t.Fatalf("Failed to generate tokens: %v", err)
	}

	// Try to verify with cfg2 (different secret)
	_, err = VerifyToken(cfg2, response.AccessToken)
	if err == nil {
		t.Error("Token verification should fail with different secret")
	}
}

func TestJWTClaimsValidation(t *testing.T) {
	cfg := getTestConfig()

	// Test different roles
	roles := []string{"super_admin", "school_admin", "teacher", "student", "parent"}

	for _, role := range roles {
		t.Run("Role_"+role, func(t *testing.T) {
			response, err := GenerateTokens(cfg, "123", "user@example.com", role, "school-1")
			if err != nil {
				t.Errorf("Failed to generate token for role %s: %v", role, err)
				return
			}

			claims, err := VerifyToken(cfg, response.AccessToken)
			if err != nil {
				t.Errorf("Failed to verify token for role %s: %v", role, err)
				return
			}

			if claims.Role != role {
				t.Errorf("Role = %v, want %v", claims.Role, role)
			}
		})
	}
}

func TestTokenSigningMethod(t *testing.T) {
	cfg := getTestConfig()

	response, err := GenerateTokens(cfg, "123", "user@example.com", "admin", "school-1")
	if err != nil {
		t.Fatalf("Failed to generate tokens: %v", err)
	}

	// Parse token without verification to check signing method
	token, _, err := new(jwt.Parser).ParseUnverified(response.AccessToken, &JWTClaims{})
	if err != nil {
		t.Fatalf("Failed to parse token: %v", err)
	}

	// Verify signing method is HS256
	if token.Method.Alg() != "HS256" {
		t.Errorf("Signing method = %v, want HS256", token.Method.Alg())
	}
}

// Benchmark tests
func BenchmarkGenerateTokens(b *testing.B) {
	cfg := getTestConfig()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = GenerateTokens(cfg, "123", "user@example.com", "admin", "school-1")
	}
}

func BenchmarkVerifyToken(b *testing.B) {
	cfg := getTestConfig()
	response, _ := GenerateTokens(cfg, "123", "user@example.com", "admin", "school-1")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = VerifyToken(cfg, response.AccessToken)
	}
}

func BenchmarkVerifyRefreshToken(b *testing.B) {
	cfg := getTestConfig()
	response, _ := GenerateTokens(cfg, "123", "user@example.com", "admin", "school-1")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = VerifyRefreshToken(cfg, response.RefreshToken)
	}
}
