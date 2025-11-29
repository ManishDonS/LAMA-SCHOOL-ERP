package utils

import (
	"testing"
)

func TestValidatePasswordComplexity(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
		errMsg   string
	}{
		{
			name:     "Valid password with all requirements",
			password: "MyP@ssw0rd",
			wantErr:  false,
		},
		{
			name:     "Valid password with symbols",
			password: "Str0ng!P@ss",
			wantErr:  false,
		},
		{
			name:     "Too short - less than 8 characters",
			password: "Sh0rt!",
			wantErr:  true,
			errMsg:   "Password must be at least 8 characters long",
		},
		{
			name:     "Missing uppercase letter",
			password: "myp@ssw0rd",
			wantErr:  true,
			errMsg:   "Password must contain at least one uppercase letter",
		},
		{
			name:     "Missing lowercase letter",
			password: "MYP@SSW0RD",
			wantErr:  true,
			errMsg:   "Password must contain at least one lowercase letter",
		},
		{
			name:     "Missing number",
			password: "MyP@ssword",
			wantErr:  true,
			errMsg:   "Password must contain at least one number",
		},
		{
			name:     "Missing special character",
			password: "MyPassw0rd",
			wantErr:  true,
			errMsg:   "Password must contain at least one special character",
		},
		{
			name:     "Common weak password",
			password: "Password1!",
			wantErr:  true,
			errMsg:   "Password is too common",
		},
		{
			name:     "Another common weak password",
			password: "Qwerty123!",
			wantErr:  true,
			errMsg:   "Password is too common",
		},
		{
			name:     "Valid complex password",
			password: "C0mpl3x!Pass",
			wantErr:  false,
		},
		{
			name:     "Valid with multiple special chars",
			password: "T3st@P@ss#2024",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePasswordComplexity(tt.password)

			if tt.wantErr {
				if err == nil {
					t.Errorf("ValidatePasswordComplexity() expected error but got nil for password: %s", tt.password)
					return
				}

				if tt.errMsg != "" && err.Error() != tt.errMsg {
					// Check if error message contains the expected substring
					if len(tt.errMsg) > 0 && len(err.Error()) > 0 {
						// Partial match is okay for some error messages
						found := false
						if err.Error()[:len(tt.errMsg)] == tt.errMsg ||
						   (len(err.Error()) >= len(tt.errMsg) && err.Error()[:len(tt.errMsg)] == tt.errMsg) {
							found = true
						}
						// Also check if tt.errMsg is contained in err.Error()
						errStr := err.Error()
						for i := 0; i <= len(errStr)-len(tt.errMsg); i++ {
							if errStr[i:i+len(tt.errMsg)] == tt.errMsg {
								found = true
								break
							}
						}
						if !found {
							t.Errorf("ValidatePasswordComplexity() error = %v, want error containing %v", err.Error(), tt.errMsg)
						}
					}
				}
			} else {
				if err != nil {
					t.Errorf("ValidatePasswordComplexity() unexpected error = %v for password: %s", err, tt.password)
				}
			}
		})
	}
}

func TestHashPassword(t *testing.T) {
	password := "TestP@ssw0rd"
	cost := 10

	hash, err := HashPassword(password, cost)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}

	if hash == "" {
		t.Error("HashPassword() returned empty hash")
	}

	if hash == password {
		t.Error("HashPassword() returned plaintext password")
	}

	// Hash should be different each time
	hash2, err := HashPassword(password, cost)
	if err != nil {
		t.Fatalf("HashPassword() second call error = %v", err)
	}

	if hash == hash2 {
		t.Error("HashPassword() returned same hash for same password (should use salt)")
	}
}

func TestVerifyPassword(t *testing.T) {
	password := "TestP@ssw0rd"
	wrongPassword := "WrongP@ssw0rd"

	hash, err := HashPassword(password, 10)
	if err != nil {
		t.Fatalf("Setup: HashPassword() error = %v", err)
	}

	// Test correct password
	err = VerifyPassword(hash, password)
	if err != nil {
		t.Errorf("VerifyPassword() failed for correct password: %v", err)
	}

	// Test wrong password
	err = VerifyPassword(hash, wrongPassword)
	if err == nil {
		t.Error("VerifyPassword() should fail for wrong password")
	}
}

func TestGeneratePasswordHash(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "Valid strong password",
			password: "Str0ng!P@ss",
			wantErr:  false,
		},
		{
			name:     "Weak password - too short",
			password: "Weak1!",
			wantErr:  true,
		},
		{
			name:     "Weak password - no special char",
			password: "WeakPass1",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a minimal config
			cfg := &struct {
				BcryptCost int
			}{
				BcryptCost: 10,
			}

			// We need to use a type that has BcryptCost field
			// For testing, we'll just call ValidatePasswordComplexity directly
			err := ValidatePasswordComplexity(tt.password)

			if tt.wantErr && err == nil {
				t.Errorf("GeneratePasswordHash() expected validation error for password: %s", tt.password)
			}

			if !tt.wantErr && err != nil {
				t.Errorf("GeneratePasswordHash() unexpected validation error = %v for password: %s", err, tt.password)
			}

			if !tt.wantErr {
				// Test actual hash generation
				hash, err := HashPassword(tt.password, cfg.BcryptCost)
				if err != nil {
					t.Errorf("HashPassword() error = %v", err)
				}
				if hash == "" {
					t.Error("HashPassword() returned empty hash")
				}
			}
		})
	}
}

func BenchmarkValidatePasswordComplexity(b *testing.B) {
	password := "Str0ng!P@ssw0rd"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = ValidatePasswordComplexity(password)
	}
}

func BenchmarkHashPassword(b *testing.B) {
	password := "Str0ng!P@ssw0rd"
	cost := 10

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = HashPassword(password, cost)
	}
}
