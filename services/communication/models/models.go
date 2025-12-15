package models

import (
	"time"
)

type CommunicationChannel struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	SchoolID    uint64    `gorm:"not null" json:"schoolId"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Type        string    `gorm:"size:50;not null" json:"type"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedBy   *uint64   `json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type CommunicationChannelMember struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ChannelID  uint64    `gorm:"not null" json:"channelId"`
	UserID     uint64    `gorm:"not null" json:"userId"`
	Role       string    `gorm:"default:'member'" json:"role"`
	JoinedAt   time.Time `json:"joinedAt"`
	LastReadAt time.Time `json:"lastReadAt"`
}

type CommunicationMessage struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ChannelID uint64    `gorm:"not null" json:"channelId"`
	SenderID  uint64    `gorm:"not null" json:"senderId"`
	Content   string    `gorm:"type:text" json:"content"`
	IsSystem  bool      `gorm:"default:false" json:"isSystem"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	// Relations (optional for GORM to helpers, but we keep it simple for now)
}
