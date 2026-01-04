package config

import (
	"log"
	"os"
)

type Config struct {
	Port           string
	Environment    string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBSSLMode      string
	JWTSecret      string
	NATSUrl        string
	RedisURL       string
	AuthServiceURL string
	LogLevel       string
	EncryptionKey  string
	EnableCORS     bool
	AllowedOrigins string
}

func LoadConfig() *Config {
	cfg := &Config{
		Port:           getEnv("STUDENT_SERVICE_PORT", "3003"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		DBHost:         getEnv("DB_HOST", "postgres"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "school_erp"),
		DBSSLMode:      getEnv("DB_SSL_MODE", "disable"),
		JWTSecret:      getEnv("JWT_SECRET", "change-me"),
		NATSUrl:        getEnv("NATS_URL", "nats://nats:4222"),
		RedisURL:       getEnv("REDIS_URL", "redis://redis:6379"),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://auth-service:3001"),
		EncryptionKey:  getEnv("ENCRYPTION_KEY", "default-key-change-in-production"),
		EnableCORS:     getEnv("ENABLE_CORS", "false") == "true",
		AllowedOrigins: getEnv("CORS_ALLOW_ORIGINS", "http://localhost:3000"),
	}
	log.Printf("[Student Service] Environment: %s, Port: %s", cfg.Environment, cfg.Port)

	// Production hardening: refuse to start with default secrets in production
	if cfg.Environment == "production" {
		if cfg.JWTSecret == "change-me" {
			log.Fatal("[FATAL] JWT_SECRET must be set in production environment")
		}
		if cfg.EncryptionKey == "default-key-change-in-production" {
			log.Fatal("[FATAL] ENCRYPTION_KEY must be set in production environment")
		}
	}

	return cfg
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
