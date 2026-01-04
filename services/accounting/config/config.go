package config

import "os"

type Config struct {
	Port        string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	NATSUrl     string
	JWTSecret   string
	CORSOrigins string
	EnableCORS  bool
}

func LoadConfig() *Config {
	return &Config{
		Port:        getEnv("PORT", "8009"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", "postgres"),
		DBName:      getEnv("DB_NAME", "school_erp"),
		NATSUrl:     getEnv("NATS_URL", "nats://localhost:4222"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key"),
		CORSOrigins: getEnv("CORS_ALLOW_ORIGINS", "http://localhost:3000"),
		EnableCORS:  getEnv("ENABLE_CORS", "false") == "true",
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
