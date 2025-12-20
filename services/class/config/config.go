package config

import (
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
	NATSURL        string
	RedisURL       string
	EncryptionKey  string
	AuthServiceURL string
}

func LoadConfig() *Config {
	return &Config{
		Port:           getEnv("CLASS_SERVICE_PORT", "3014"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "school_erp"),
		NATSURL:        getEnv("NATS_URL", "nats://localhost:4222"),
		RedisURL:       getEnv("REDIS_URL", "redis://localhost:6379"),
		EncryptionKey:  os.Getenv("ENCRYPTION_KEY"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://localhost:3001"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
