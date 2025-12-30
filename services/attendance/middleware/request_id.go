package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// RequestIDMiddleware generates a unique request ID for each request
func RequestIDMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check if request ID already exists in header
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			// Generate new UUID
			requestID = uuid.New().String()
		}

		// Store in context for use in handlers and logging
		c.Locals("request_id", requestID)

		// Add to response headers for tracing
		c.Set("X-Request-ID", requestID)

		return c.Next()
	}
}
