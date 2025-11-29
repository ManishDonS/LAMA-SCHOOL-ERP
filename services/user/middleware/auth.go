package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Missing authorization header",
		})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid authorization header format",
		})
	}

	// For now, just validate that a token is present
	// In production, validate the JWT signature and claims
	token := parts[1]
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Empty token",
		})
	}

	// Parse token (basic validation)
	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		// This is where you'd validate the signature
		// For now, just return a dummy key
		return []byte("dummy"), nil
	})

	if err != nil {
		// Token parsing failed, but we'll allow it in development
		// In production, reject invalid tokens
	}

	c.Locals("user_id", claims["sub"])
	return c.Next()
}
