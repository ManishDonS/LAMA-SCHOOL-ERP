package config

import (
	"os"
	"time"
)

type Config struct {
	Port               string
	Environment        string
	DatabaseURL        string
	JWTSecret          string
	JWTRefreshSecret   string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
	BcryptCost         int
	ServerReadTimeout  time.Duration
	ServerWriteTimeout time.Duration
	MaxConnections     int
}

func LoadConfig() *Config {
	accessExpiry := 15 * time.Minute
	if env := os.Getenv("ACCESS_TOKEN_EXPIRY_MINS"); env != "" {
		// Parse if needed, for now using default
	}

	return &Config{
		Port:               getEnv("PORT", "3001"),
		Environment:        getEnv("ENVIRONMENT", "development"),
		DatabaseURL:        getRequiredEnv("DATABASE_URL"),
		JWTSecret:          getRequiredEnv("JWT_SECRET"),
		JWTRefreshSecret:   getRequiredEnv("REFRESH_TOKEN_SECRET"),
		AccessTokenExpiry:  accessExpiry,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
		BcryptCost:         12,
		ServerReadTimeout:  10 * time.Second,
		ServerWriteTimeout: 10 * time.Second,
		MaxConnections:     25,
	}
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}

func getRequiredEnv(key string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		if os.Getenv("ENVIRONMENT") == "production" {
			// Panic in production if secret is missing
			panic("Missing required environment variable: " + key)
		}
		// For local dev, we might want to allow empty or warn, but strict is better
		panic("Missing required environment variable: " + key)
	}
	return value
}
