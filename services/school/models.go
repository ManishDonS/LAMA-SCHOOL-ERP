package main

import (
	"time"
)

// School represents a school tenant
type School struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Code      string    `json:"code" db:"code"` // Unique identifier (e.g., "EIS", "KMC")
	DBName    string    `json:"db_name" db:"db_name"`
	DBUser    string    `json:"db_user" db:"db_user"`
	DBPassword string    `json:"-" db:"db_password"` // Never expose in JSON
	DBHost    string    `json:"db_host" db:"db_host"`
	DBPort    int       `json:"db_port" db:"db_port"`
	Domain    string    `json:"domain" db:"domain"` // e.g., eis.schoolerp.com
	LogoURL   string    `json:"logo_url" db:"logo_url"`
	Timezone  string    `json:"timezone" db:"timezone"`
	Status    string    `json:"status" db:"status"` // active, inactive, suspended
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CreateSchoolRequest is the request body for creating a school
type CreateSchoolRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=255"`
	Code     string `json:"code" validate:"required,min=2,max=20,alphanum"`
	Domain   string `json:"domain" validate:"required,fqdn"`
	LogoURL  string `json:"logo_url" validate:"omitempty,url"`
	Timezone string `json:"timezone" validate:"required,timezone"`
}

// UpdateSchoolRequest is the request body for updating a school
type UpdateSchoolRequest struct {
	Name    string `json:"name" validate:"omitempty,min=2,max=255"`
	Domain  string `json:"domain" validate:"omitempty,fqdn"`
	LogoURL string `json:"logo_url" validate:"omitempty,url"`
	Status  string `json:"status" validate:"omitempty,oneof=active inactive suspended"`
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
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Domain    string    `json:"domain"`
	LogoURL   string    `json:"logo_url"`
	Timezone  string    `json:"timezone"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToResponse converts a School to SchoolResponse (removes sensitive data)
func (s *School) ToResponse() SchoolResponse {
	return SchoolResponse{
		ID:        s.ID,
		Name:      s.Name,
		Code:      s.Code,
		Domain:    s.Domain,
		LogoURL:   s.LogoURL,
		Timezone:  s.Timezone,
		Status:    s.Status,
		CreatedAt: s.CreatedAt,
		UpdatedAt: s.UpdatedAt,
	}
}
