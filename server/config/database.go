package config

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"server/models"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")

	if dsn == "" {
		log.Fatal("DATABASE_URL is not set ❌")
	}

	log.Println("Connecting to database...")

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully ✅")

	err = db.AutoMigrate(&models.User{}, &models.OTP{})
	if err != nil {
		log.Fatal("AutoMigrate failed:", err)
	}

	log.Println("AutoMigrate completed ✅")

	DB = db
}
