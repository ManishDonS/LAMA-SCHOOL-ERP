package database

import (
	"fmt"
	"log"

	"school-erp/website/config"
	"school-erp/website/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes the database connection
func InitDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := cfg.GetDSN()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// Auto Migrate
	log.Println("Running migrations...")
	err = db.AutoMigrate(
		&models.Website{},
		&models.Page{},
		&models.Component{},
		&models.Media{},
		&models.Analytics{},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to run migrations: %v", err)
	}

	DB = db
	return db, nil
}
