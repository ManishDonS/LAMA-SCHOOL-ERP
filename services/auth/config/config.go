package config

import (
	"os"
	"time"
)

type Config struct {
	Port               string
	Environment        string
	DatabaseURL        string
	DBHost             string
	DBPort             string
	DBName             string
	DBUser             string
	DBPassword         string
	JWTSecret          string
	JWTRefreshSecret   string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
	BcryptCost         int
	ServerReadTimeout  time.Duration
	ServerWriteTimeout time.Duration
	MaxConnections     int
	SuperAdminEmail    string
	SuperAdminPassword string
	EncryptionKey      string
	EnableCORS         bool
	AllowedOrigins     string
	RedisURL           string
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
		DBHost:             getEnv("DB_HOST", "postgres"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DBName:             getEnv("DB_NAME", "school_erp"),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPassword:         getEnv("DB_PASSWORD", "postgres"),
		JWTSecret:          getRequiredEnv("JWT_SECRET"),
		JWTRefreshSecret:   getRequiredEnv("REFRESH_TOKEN_SECRET"),
		AccessTokenExpiry:  accessExpiry,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
		BcryptCost:         12,
		ServerReadTimeout:  10 * time.Second,
		ServerWriteTimeout: 10 * time.Second,
		MaxConnections:     25,
		SuperAdminEmail:    getEnv("SUPER_ADMIN_EMAIL", ""),
		SuperAdminPassword: getEnv("SUPER_ADMIN_PASSWORD", ""),
		EncryptionKey:      getRequiredEnv("ENCRYPTION_KEY"),
		EnableCORS:         getEnv("ENABLE_CORS", "false") == "true",
		AllowedOrigins:     getEnv("CORS_ALLOW_ORIGINS", "http://localhost:3000"),
		RedisURL:           getEnv("REDIS_URL", "redis://redis:6379"),
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
