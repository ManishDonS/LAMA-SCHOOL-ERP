package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

var Logger zerolog.Logger

// InitLogger initializes the global logger with appropriate configuration
func InitLogger(env string) {
	// Set up console writer for development
	if env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		})
	} else {
		// JSON output for production
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
		log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()
	}

	// Set global log level
	switch env {
	case "development":
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	case "production":
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	default:
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	Logger = log.Logger
	Logger.Info().Str("environment", env).Msg("Logger initialized")
}

// GetLogger returns the global logger instance
func GetLogger() *zerolog.Logger {
	return &Logger
}

// WithContext creates a logger with request context information
func WithContext(requestID, method, path, ip string) zerolog.Logger {
	return Logger.With().
		Str("request_id", requestID).
		Str("method", method).
		Str("path", path).
		Str("ip", ip).
		Logger()
}

// AuditLog logs security-critical events
func AuditLog(userID int64, action, resource, ipAddress string, success bool, err error) {
	event := Logger.Info()
	if err != nil || !success {
		event = Logger.Error().Err(err)
	}

	event.
		Str("type", "audit").
		Int64("user_id", userID).
		Str("action", action).
		Str("resource", resource).
		Str("ip", ipAddress).
		Bool("success", success).
		Msg("Audit event")
}

// ErrorLog logs application errors with context
func ErrorLog(component string, err error, msg string) {
	Logger.Error().
		Err(err).
		Str("component", component).
		Msg(msg)
}

// SecurityLog logs security-related events
func SecurityLog(event string, userID int64, ip string, details map[string]interface{}) {
	logger := Logger.Warn().
		Str("type", "security").
		Str("event", event).
		Int64("user_id", userID).
		Str("ip", ip)

	if details != nil {
		logger = logger.Fields(details)
	}

	logger.Msg("Security event")
}
