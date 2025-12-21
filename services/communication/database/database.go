package database

import (
	"fmt"
	"log"
	"os"
	"school-erp/communication/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	var err error
	// Use URL format for DSN as it's more robust against empty environment variables
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable&TimeZone=Asia/Kathmandu",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	// Fallback/Log
	log.Printf("Connecting to DB: host=%s port=%s user=%s dbname=%s",
		os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_NAME"))

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	// Auto Migrate models
	err = DB.AutoMigrate(
		&models.CommunicationChannel{},
		&models.CommunicationChannelMember{},
		&models.CommunicationMessage{},
		&models.User{},
		&models.Student{},
	)
	if err != nil {
		log.Printf("Warning: Auto-migration failed: %v", err)
	}

	log.Println("Database connection successfully established")
}
