package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds the application configuration
type Config struct {
	// App
	Port        int
	Environment string
	AppName     string

	// Database
	DBHost     string
	DBPort     int
	DBName     string
	DBUser     string
	DBPassword string

	// AI Service
	OpenAIKey string
	GeminiKey string

	// Redis
	RedisHost string
	RedisPort int

	// CORS
	CORSAllowOrigins string
	EnableCORS       bool
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		// App
		Port:        getEnvInt("WEBSITE_SERVICE_PORT", 3013),
		Environment: getEnv("ENVIRONMENT", "development"),
		AppName:     "School ERP - Website Service",

		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvInt("DB_PORT", 5432),
		DBName:     getEnv("DB_NAME", "school_erp"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),

		// AI
		OpenAIKey: getEnv("OPENAI_API_KEY", ""),
		GeminiKey: getEnv("GEMINI_API_KEY", ""),

		// Redis
		RedisHost: getEnv("REDIS_HOST", "localhost"),
		RedisPort: getEnvInt("REDIS_PORT", 6379),

		// CORS
		CORSAllowOrigins: getEnv("CORS_ALLOW_ORIGINS", "http://localhost:3000"),
		EnableCORS:       getEnv("ENABLE_CORS", "false") == "true",
	}
}

// GetDSN returns the database connection string
func (c *Config) GetDSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		c.DBUser,
		c.DBPassword,
		c.DBHost,
		c.DBPort,
		c.DBName,
	)
}

// Helper functions
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	intVal, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return intVal
}
