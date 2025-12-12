package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Website represents a school's website
type Website struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	SchoolID     string `gorm:"index;not null" json:"school_id"`
	Name         string `gorm:"not null" json:"name"`
	Description  string `json:"description"`
	Industry     string `json:"industry"`                  // e.g., Education, Portfolio, etc.
	Domain       string `gorm:"uniqueIndex" json:"domain"` // e.g., school.lama-erp.com or custom
	CustomDomain string `gorm:"uniqueIndex" json:"custom_domain,omitempty"`
	Status       string `gorm:"default:'draft'" json:"status"` // draft, published, archived
	LogoURL      string `json:"logo_url"`
	FaviconURL   string `json:"favicon_url"`

	// Branding & Design
	PrimaryColor   string `json:"primary_color"`
	SecondaryColor string `json:"secondary_color"`
	AccentColor    string `json:"accent_color"`
	FontBody       string `json:"font_body"`
	FontHeading    string `json:"font_heading"`

	// Settings
	Settings datatypes.JSON `json:"settings"` // Global site settings

	// Relationships
	Pages []Page `gorm:"foreignKey:WebsiteID" json:"pages,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName overrides the table name
func (Website) TableName() string {
	return "websites"
}
