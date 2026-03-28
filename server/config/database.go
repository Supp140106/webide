package config

import (
	"log"
	"os"

	"server/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")

	if dsn == "" {
		log.Fatal("DATABASE_URL is not set ❌")
	}

	log.Println("Connecting to database...")

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully ✅")

	err = db.AutoMigrate(&models.User{}, &models.OTP{}, &models.Project{}, &models.File{})
	if err != nil {
		log.Fatal("AutoMigrate failed:", err)
	}

	log.Println("AutoMigrate completed ✅")

	DB = db
}
