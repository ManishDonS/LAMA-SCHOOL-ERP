package models

import (
	"time"
)

// Analytics stores daily aggregated stats for a website
type Analytics struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	WebsiteID uint      `gorm:"index;not null" json:"website_id"`
	Date      time.Time `gorm:"index;not null;type:date" json:"date"`

	PageViews      int     `gorm:"default:0" json:"page_views"`
	UniqueVisitors int     `gorm:"default:0" json:"unique_visitors"`
	BounceRate     float64 `gorm:"default:0" json:"bounce_rate"`  // percentage
	AvgDuration    float64 `gorm:"default:0" json:"avg_duration"` // seconds

	DeviceMobile  int `gorm:"default:0" json:"device_mobile"`
	DeviceDesktop int `gorm:"default:0" json:"device_desktop"`
	DeviceTablet  int `gorm:"default:0" json:"device_tablet"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Analytics) TableName() string {
	return "analytics"
}
