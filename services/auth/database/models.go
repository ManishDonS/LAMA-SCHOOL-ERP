package database

import (
	"time"
)

type User struct {
	ID           int64     `db:"id"`
	SchoolID     int64     `db:"school_id"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"`
	FirstName    string    `db:"first_name"`
	LastName     string    `db:"last_name"`
	Role         string    `db:"role"` // admin, teacher, student, parent, staff
	Status       string    `db:"status"` // active, inactive, suspended
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

type Role struct {
	ID          int64     `db:"id"`
	Name        string    `db:"name"`
	Description string    `db:"description"`
	Permissions []string  `db:"permissions"` // JSON array
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}

type RefreshToken struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	Token     string    `db:"token"`
	ExpiresAt time.Time `db:"expires_at"`
	CreatedAt time.Time `db:"created_at"`
	RevokedAt *time.Time `db:"revoked_at"`
}

type AuditLog struct {
	ID        int64     `db:"id"`
	UserID    int64     `db:"user_id"`
	Action    string    `db:"action"`
	Resource  string    `db:"resource"`
	Details   string    `db:"details"`
	IPAddress string    `db:"ip_address"`
	CreatedAt time.Time `db:"created_at"`
}
