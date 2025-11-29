package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds the application configuration
type Config struct {
	// App
	Port        int
	Environment string
	AppName     string

	// Main Database (Global DB)
	MainDBHost     string
	MainDBPort     int
	MainDBName     string
	MainDBUser     string
	MainDBPassword string
	MaxConnections int
	MaxIdleConn    int
	ConnMaxLifetime time.Duration

	// Cache (Redis)
	RedisHost string
	RedisPort int
	RedisDB   int

	// Security
	EncryptionKey string
	JWTSecret     string

	// CORS
	CORSAllowOrigins string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		// App
		Port:        getEnvInt("PORT", 3011),
		Environment: getEnv("ENVIRONMENT", "development"),
		AppName:     "School Management Service",

		// Main Database
		MainDBHost:     getEnv("DB_HOST", "postgres"),
		MainDBPort:     getEnvInt("DB_PORT", 5432),
		MainDBName:     getEnv("DB_NAME", "school_erp"),
		MainDBUser:     getEnv("DB_USER", "postgres"),
		MainDBPassword: getEnv("DB_PASSWORD", "postgres"),
		MaxConnections: getEnvInt("MAX_CONNECTIONS", 25),
		MaxIdleConn:    getEnvInt("MAX_IDLE_CONN", 5),
		ConnMaxLifetime: time.Duration(getEnvInt("CONN_MAX_LIFETIME", 5)) * time.Minute,

		// Cache
		RedisHost: getEnv("REDIS_HOST", "redis"),
		RedisPort: getEnvInt("REDIS_PORT", 6379),
		RedisDB:   getEnvInt("REDIS_DB", 0),

		// Security
		EncryptionKey: getEnv("ENCRYPTION_KEY", "default-key-change-in-production"),
		JWTSecret:     getEnv("JWT_SECRET", "your-super-secret-jwt-key"),

		// CORS
		CORSAllowOrigins: getEnv("CORS_ALLOW_ORIGINS", "http://localhost:3000,http://localhost:3001"),
	}
}

// GetMainDSN returns the main database connection string
func (c *Config) GetMainDSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		c.MainDBUser,
		c.MainDBPassword,
		c.MainDBHost,
		c.MainDBPort,
		c.MainDBName,
	)
}

// GetTenantDSN returns a tenant-specific database connection string
func (c *Config) GetTenantDSN(host string, port int, dbName, user, password string) string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		user,
		password,
		host,
		port,
		dbName,
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
