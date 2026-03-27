package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     string    `gorm:"uniqueIndex" json:"email"`
	Password  string    `json:"-"` // Password should not be returned in JSON
	Verified  bool      `json:"verified"`
	CreatedAt time.Time `json:"created_at"`
}

type OTP struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email     string
	Code      string
	ExpiresAt time.Time
}
