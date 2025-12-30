package config

import (
	"log"
	"os"
)

type Config struct {
	Port          string
	Environment   string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	DBSSLMode     string
	JWTSecret     string
	NATSUrl       string
	RedisURL      string
	LogLevel      string
	UploadPath    string
	MaxFileSize   int64
	EncryptionKey string
}

func LoadConfig() *Config {
	cfg := &Config{
		Port:          getEnv("EXPENSE_SERVICE_PORT", "3010"),
		Environment:   getEnv("ENVIRONMENT", "development"),
		DBHost:        getEnv("DB_HOST", "postgres"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "postgres"),
		DBPassword:    getEnv("DB_PASSWORD", "postgres"),
		DBName:        getEnv("DB_NAME", "school_erp"),
		DBSSLMode:     getEnv("DB_SSL_MODE", "disable"),
		JWTSecret:     getEnv("JWT_SECRET", "change-me"),
		NATSUrl:       getEnv("NATS_URL", "nats://localhost:4222"),
		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379"),
		LogLevel:      getEnv("LOG_LEVEL", "info"),
		UploadPath:    getEnv("UPLOAD_PATH", "./uploads"),
		MaxFileSize:   10 * 1024 * 1024, // 10MB
		EncryptionKey: getEnv("ENCRYPTION_KEY", "change-me-in-production-very-secret"),
	}
	log.Printf("[Expense Service] Environment: %s, Port: %s", cfg.Environment, cfg.Port)
	return cfg
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
