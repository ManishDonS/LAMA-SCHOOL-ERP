package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Page represents a single page in the website
type Page struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	WebsiteID   uint   `gorm:"index;not null" json:"website_id"`
	Title       string `gorm:"not null" json:"title"`
	Slug        string `gorm:"index;not null" json:"slug"` // e.g., /about-us
	Description string `json:"description"`
	IsHome      bool   `gorm:"default:false" json:"is_home"`
	IsPublished bool   `gorm:"default:false" json:"is_published"`
	Order       int    `gorm:"default:0" json:"order"`

	// SEO Settings
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	MetaKeywords    string `json:"meta_keywords"`
	OGImage         string `json:"og_image"`

	// Content (Draft vs Published logic could be implemented here or separate table)
	Layout datatypes.JSON `json:"layout"` // JSON structure of the page layout/components

	// Relationships
	Components []Component `gorm:"foreignKey:PageID" json:"components,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Component represents a UI block on a page
type Component struct {
	ID       uint           `gorm:"primaryKey" json:"id"`
	PageID   uint           `gorm:"index;not null" json:"page_id"`
	Type     string         `gorm:"not null" json:"type"` // e.g., hero, navbar, gallery, text
	Content  datatypes.JSON `json:"content"`              // The actual content (text, image URLs, etc.)
	Styles   datatypes.JSON `json:"styles"`               // CSS styles specific to this component instance
	Order    int            `gorm:"default:0" json:"order"`
	ParentID *uint          `json:"parent_id,omitempty"` // For nested components

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Page) TableName() string {
	return "pages"
}

func (Component) TableName() string {
	return "components"
}
