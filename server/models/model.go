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

type Project struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	RepoURL       string    `gorm:"not null" json:"repoUrl"`
	Name          string    `gorm:"not null" json:"name"`
	ContainerName string    `json:"containerName"`
	UserID        uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	User          User      `gorm:"foreignKey:UserID" json:"-"`
	Files         []File    `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"files,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
}

type File struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ProjectID uuid.UUID `gorm:"type:uuid;not null" json:"projectId"`
	Path      string    `gorm:"not null" json:"path"`
	Content   string    `gorm:"type:text" json:"content"`
	IsDir     bool      `gorm:"not null" json:"isDir"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
