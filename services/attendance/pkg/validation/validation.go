package validation

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
}

// MarkAttendanceRequest represents the request to mark attendance
type MarkAttendanceRequest struct {
	StudentID int64  `json:"student_id" validate:"required,gt=0"`
	Class     string `json:"class" validate:"required"`
	Date      string `json:"date" validate:"omitempty"`
	Status    string `json:"status" validate:"required,oneof=present absent leave"`
	Remarks   string `json:"remarks" validate:"omitempty,max=500"`
}

// UpdateAttendanceRequest represents the request to update attendance
type UpdateAttendanceRequest struct {
	Status  string `json:"status" validate:"omitempty,oneof=present absent leave"`
	Remarks string `json:"remarks" validate:"omitempty,max=500"`
	Date    string `json:"date" validate:"omitempty"`
}

// Validate validates a struct and returns user-friendly error messages
func Validate(s interface{}) error {
	err := validate.Struct(s)
	if err == nil {
		return nil
	}

	validationErrors := err.(validator.ValidationErrors)
	var errorMessages []string

	for _, e := range validationErrors {
		errorMessages = append(errorMessages, formatValidationError(e))
	}

	return fmt.Errorf("%s", strings.Join(errorMessages, "; "))
}

// formatValidationError formats a validation error into a user-friendly message
func formatValidationError(e validator.FieldError) string {
	field := e.Field()

	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "gt":
		return fmt.Sprintf("%s must be greater than %s", field, e.Param())
	case "oneof":
		return fmt.Sprintf("%s must be one of: %s", field, e.Param())
	case "max":
		return fmt.Sprintf("%s must not exceed %s characters", field, e.Param())
	default:
		return fmt.Sprintf("%s failed validation: %s", field, e.Tag())
	}
}
