package handlers

import (
	"time"
)

// School represents a school tenant
type School struct {
	ID                string                     `json:"id" db:"id"`
	Name              string                     `json:"name" db:"name"`
	Code              string                     `json:"code" db:"code"` // Unique identifier (e.g., "EIS", "KMC")
	DBName            string                     `json:"db_name" db:"db_name"`
	DBUser            string                     `json:"db_user" db:"db_user"`
	DBPassword        string                     `json:"-" db:"db_password"` // Never expose in JSON
	DBHost            string                     `json:"db_host" db:"db_host"`
	DBPort            int                        `json:"db_port" db:"db_port"`
	Domain            string                     `json:"domain" db:"domain"` // e.g., eis.schoolerp.com
	LogoURL           string                     `json:"logo_url" db:"logo_url"`
	Timezone          string                     `json:"timezone" db:"timezone"`
	Email             string                     `json:"email" db:"email"`
	Phone             string                     `json:"phone" db:"phone"`
	Address           string                     `json:"address" db:"address"`
	City              string                     `json:"city" db:"city"`
	State             string                     `json:"state" db:"state"`
	Country           string                     `json:"country" db:"country"`
	Pincode           string                     `json:"pincode" db:"pincode"`
	Website           string                     `json:"website" db:"website"`
	Status            string                     `json:"status" db:"status"`
	ActiveModules     []string                   `json:"active_modules" db:"active_modules"`
	ModulePermissions map[string]map[string]bool `json:"module_permissions" db:"module_permissions"`
	CreatedAt         time.Time                  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time                  `json:"updated_at" db:"updated_at"`
}

// CreateSchoolRequest is the request body for creating a school
type CreateSchoolRequest struct {
	Name              string                     `json:"name" validate:"required,min=2,max=255"`
	Code              string                     `json:"code" validate:"required,min=2,max=20"` // Removed strictly alphanumeric to allow hyphens/underscores
	Domain            string                     `json:"domain" validate:"required"`
	LogoURL           string                     `json:"logo_url" validate:"omitempty"` // Removed url tag to allow relative paths from uploads
	Timezone          string                     `json:"timezone" validate:"required"`
	DBUser            string                     `json:"db_user" validate:"omitempty"`
	DBPassword        string                     `json:"db_password" validate:"omitempty"`
	Email             string                     `json:"email" validate:"omitempty,email"`
	Phone             string                     `json:"phone" validate:"omitempty"`
	Address           string                     `json:"address" validate:"omitempty"`
	City              string                     `json:"city" validate:"omitempty"`
	State             string                     `json:"state" validate:"omitempty"`
	Country           string                     `json:"country" validate:"omitempty"`
	Pincode           string                     `json:"pincode" validate:"omitempty"`
	Website           string                     `json:"website" validate:"omitempty"`
	ModulePermissions map[string]map[string]bool `json:"module_permissions" validate:"omitempty"`
	AdminEmail        string                     `json:"admin_email" validate:"required,email"`
	AdminPassword     string                     `json:"admin_password" validate:"required,min=8"`
	AdminFirstName    string                     `json:"admin_first_name" validate:"required"`
	AdminLastName     string                     `json:"admin_last_name" validate:"required"`
}

// UpdateSchoolRequest is the request body for updating a school
type UpdateSchoolRequest struct {
	Name              string                     `json:"name" validate:"omitempty,min=2,max=255"`
	Domain            string                     `json:"domain" validate:"omitempty"`
	LogoURL           string                     `json:"logo_url" validate:"omitempty,url"`
	Timezone          string                     `json:"timezone" validate:"omitempty"`
	Email             string                     `json:"email" validate:"omitempty,email"`
	Phone             string                     `json:"phone" validate:"omitempty"`
	Address           string                     `json:"address" validate:"omitempty"`
	City              string                     `json:"city" validate:"omitempty"`
	State             string                     `json:"state" validate:"omitempty"`
	Country           string                     `json:"country" validate:"omitempty"`
	Pincode           string                     `json:"pincode" validate:"omitempty"`
	Website           string                     `json:"website" validate:"omitempty"`
	Status            string                     `json:"status" validate:"omitempty,oneof=active inactive suspended"`
	ModulePermissions map[string]map[string]bool `json:"module_permissions" validate:"omitempty"`
}

// SchoolDBCredentials holds encrypted database credentials
type SchoolDBCredentials struct {
	Host     string
	Port     int
	DBName   string
	User     string
	Password string
}

// SchoolResponse is the response body for school endpoints (without sensitive data)
type SchoolResponse struct {
	ID                string                     `json:"id"`
	Name              string                     `json:"name"`
	Code              string                     `json:"code"`
	Domain            string                     `json:"domain"`
	LogoURL           string                     `json:"logo_url"`
	Timezone          string                     `json:"timezone"`
	Email             string                     `json:"email"`
	Phone             string                     `json:"phone"`
	Address           string                     `json:"address"`
	City              string                     `json:"city"`
	State             string                     `json:"state"`
	Country           string                     `json:"country"`
	Pincode           string                     `json:"pincode"`
	Website           string                     `json:"website"`
	Status            string                     `json:"status"`
	ActiveModules     []string                   `json:"active_modules"`
	ModulePermissions map[string]map[string]bool `json:"module_permissions"`
	CreatedAt         time.Time                  `json:"created_at"`
	UpdatedAt         time.Time                  `json:"updated_at"`
}

// UpdateSchoolAdminRequest is the request body for updating a school admin
type UpdateSchoolAdminRequest struct {
	FirstName string `json:"first_name" validate:"omitempty"`
	LastName  string `json:"last_name" validate:"omitempty"`
	Email     string `json:"email" validate:"omitempty,email"`
	Password  string `json:"password" validate:"omitempty,min=8"`
}

// GetSchoolAdminResponse is the response body for getting school admin details
type GetSchoolAdminResponse struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
}

// ToResponse converts a School to SchoolResponse (removes sensitive data)
func (s *School) ToResponse() SchoolResponse {
	return SchoolResponse{
		ID:                s.ID,
		Name:              s.Name,
		Code:              s.Code,
		Domain:            s.Domain,
		LogoURL:           s.LogoURL,
		Timezone:          s.Timezone,
		Email:             s.Email,
		Phone:             s.Phone,
		Address:           s.Address,
		City:              s.City,
		State:             s.State,
		Country:           s.Country,
		Pincode:           s.Pincode,
		Website:           s.Website,
		Status:            s.Status,
		ActiveModules:     s.ActiveModules,
		ModulePermissions: s.ModulePermissions,
		CreatedAt:         s.CreatedAt,
		UpdatedAt:         s.UpdatedAt,
	}
}
