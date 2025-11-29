package utils

import (
	"unicode"

	"golang.org/x/crypto/bcrypt"

	"school-erp/auth/config"
)

// PasswordComplexityError contains details about password validation failures
type PasswordComplexityError struct {
	Message string
}

func (e *PasswordComplexityError) Error() string {
	return e.Message
}

// ValidatePasswordComplexity checks if password meets security requirements
func ValidatePasswordComplexity(password string) error {
	if len(password) < 8 {
		return &PasswordComplexityError{Message: "Password must be at least 8 characters long"}
	}

	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return &PasswordComplexityError{Message: "Password must contain at least one uppercase letter"}
	}
	if !hasLower {
		return &PasswordComplexityError{Message: "Password must contain at least one lowercase letter"}
	}
	if !hasNumber {
		return &PasswordComplexityError{Message: "Password must contain at least one number"}
	}
	if !hasSpecial {
		return &PasswordComplexityError{Message: "Password must contain at least one special character"}
	}

	// Check for common weak passwords
	commonPasswords := []string{
		"Password1!", "Qwerty123!", "Admin123!", "Welcome1!",
	}
	for _, weak := range commonPasswords {
		if password == weak {
			return &PasswordComplexityError{Message: "Password is too common, please choose a stronger password"}
		}
	}

	return nil
}

func HashPassword(password string, cost int) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	return string(hash), err
}

func VerifyPassword(hashedPassword, plainPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
}

func GeneratePasswordHash(cfg *config.Config, password string) (string, error) {
	// Validate password complexity before hashing
	if err := ValidatePasswordComplexity(password); err != nil {
		return "", err
	}
	return HashPassword(password, cfg.BcryptCost)
}
