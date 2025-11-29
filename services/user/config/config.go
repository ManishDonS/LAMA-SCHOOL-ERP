package config

import (
	"log"
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Server
	Port        string
	Environment string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// JWT
	JWTSecret    string
	RefreshSecret string
	AccessTokenExpiry   time.Duration
	RefreshTokenExpiry  time.Duration

	// NATS
	NATSUrl string

	// Redis
	RedisURL string

	// Logging
	LogLevel string
}

func LoadConfig() *Config {
	cfg := &Config{
		// Server
		Port:        getEnv("USER_SERVICE_PORT", "3002"),
		Environment: getEnv("ENVIRONMENT", "development"),

		// Database
		DBHost:     getEnv("DB_HOST", "postgres"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "school_erp"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		// JWT
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"),
		RefreshSecret:      getEnv("REFRESH_TOKEN_SECRET", "change-me-in-production"),
		AccessTokenExpiry:  parseDuration(getEnv("ACCESS_TOKEN_EXPIRY", "15m")),
		RefreshTokenExpiry: parseDuration(getEnv("REFRESH_TOKEN_EXPIRY", "7d")),

		// NATS
		NATSUrl: getEnv("NATS_URL", "nats://localhost:4222"),

		// Redis
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),

		// Logging
		LogLevel: getEnv("LOG_LEVEL", "info"),
	}

	log.Printf("[User Service Config] Environment: %s, Port: %s", cfg.Environment, cfg.Port)
	return cfg
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultVal
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		log.Printf("Invalid duration '%s', using default", s)
		return 15 * time.Minute
	}
	return d
}
