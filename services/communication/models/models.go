package models

import (
	"time"
)

type CommunicationChannel struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	SchoolID    string    `gorm:"size:255;not null" json:"schoolId"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Type        string    `gorm:"size:50;not null" json:"type"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedBy   *string   `json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type CommunicationChannelMember struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ChannelID  uint64    `gorm:"not null" json:"channelId"`
	UserID     string    `gorm:"size:255;not null" json:"userId"`
	Role       string    `gorm:"default:'member'" json:"role"`
	JoinedAt   time.Time `json:"joinedAt"`
	LastReadAt time.Time `json:"lastReadAt"`
}

type CommunicationMessage struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ChannelID uint64    `gorm:"not null" json:"channelId"`
	SenderID  string    `gorm:"not null" json:"senderId"`
	Content   string    `gorm:"type:text" json:"content"`
	IsSystem  bool      `gorm:"default:false" json:"isSystem"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type User struct {
	ID        string `gorm:"primaryKey" json:"id"`
	SchoolID  string `gorm:"size:255;not null" json:"schoolId"`
	Email     string `gorm:"size:255;not null" json:"email"`
	FirstName string `gorm:"size:100" json:"firstName"`
	LastName  string `gorm:"size:100" json:"lastName"`
	Role      string `gorm:"size:50;not null" json:"role"`
	Avatar    string `gorm:"-" json:"avatar"`
	Status    string `gorm:"size:50" json:"status"`
}

// TableName overrides the table name used by User to `users`
func (User) TableName() string {
	return "users"
}

type Student struct {
	ID        string `gorm:"primaryKey" json:"id"`
	FirstName string `gorm:"size:100" json:"firstName"`
	LastName  string `gorm:"size:100" json:"lastName"`
	Email     string `gorm:"size:255" json:"email"`
	PhotoURL  string `gorm:"column:photo_url" json:"photoUrl"`
}

type Teacher struct {
	ID uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	// Teacher table needs to join with users for name? Or does it have it?
	// Looking at user/database/models.go, Teacher had no name.
	// We will assume for now we might restricted to users table or try to join.
	// Wait, let's just stick to users and students first as user explicitly mentioned students.
}
