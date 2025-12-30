package database

import (
	"time"
)

type User struct {
	ID                  string     `db:"id"`
	SchoolID            string     `db:"school_id"`
	Email               string     `db:"email"`
	PasswordHash        string     `db:"password_hash"`
	FirstName           string     `db:"first_name"`
	LastName            string     `db:"last_name"`
	Role                string     `db:"role"`   // admin, teacher, student, parent, staff
	Status              string     `db:"status"` // active, inactive, suspended
	FailedLoginAttempts int        `json:"failed_login_attempts"`
	LockedUntil         *time.Time `json:"locked_until"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type Role struct {
	ID          string    `db:"id"`
	Name        string    `db:"name"`
	Description string    `db:"description"`
	Permissions []string  `db:"permissions"` // JSON array
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}

type RefreshToken struct {
	ID        string     `db:"id"`
	UserID    string     `db:"user_id"`
	Token     string     `db:"token"`
	ExpiresAt time.Time  `db:"expires_at"`
	CreatedAt time.Time  `db:"created_at"`
	RevokedAt *time.Time `db:"revoked_at"`
}

type AuditLog struct {
	ID        string    `db:"id"`
	UserID    string    `db:"user_id"`
	Action    string    `db:"action"`
	Resource  string    `db:"resource"`
	Details   string    `db:"details"`
	IPAddress string    `db:"ip_address"`
	CreatedAt time.Time `db:"created_at"`
}
