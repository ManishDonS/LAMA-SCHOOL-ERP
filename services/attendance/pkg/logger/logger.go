package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

var Logger zerolog.Logger

// InitLogger initializes the global logger
func InitLogger() {
	// Set log level from environment, default to info
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		if os.Getenv("ENV") == "development" {
			logLevel = "debug"
		} else {
			logLevel = "info"
		}
	}

	level, err := zerolog.ParseLevel(logLevel)
	if err != nil {
		level = zerolog.InfoLevel
	}

	zerolog.SetGlobalLevel(level)

	// Use pretty console output in development
	if os.Getenv("ENV") == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		})
	} else {
		// JSON output for production
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	}

	Logger = log.With().
		Str("service", "attendance").
		Logger()
}

// GetLogger returns the global logger
func GetLogger() zerolog.Logger {
	return Logger
}
