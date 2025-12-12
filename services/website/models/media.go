package models

import (
	"time"

	"gorm.io/gorm"
)

// Media represents an uploaded file
type Media struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	WebsiteID    uint   `gorm:"index;not null" json:"website_id"`
	Filename     string `gorm:"not null" json:"filename"`
	OriginalName string `json:"original_name"`
	URL          string `gorm:"not null" json:"url"`
	Type         string `json:"type"` // image, video, document
	MimeType     string `json:"mime_type"`
	Size         int64  `json:"size"` // in bytes
	AltText      string `json:"alt_text"`

	// Dimensions for images
	Width  int `json:"width,omitempty"`
	Height int `json:"height,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Media) TableName() string {
	return "media"
}
