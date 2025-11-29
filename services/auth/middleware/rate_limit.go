package middleware

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"school-erp/auth/pkg/logger"
)

// RateLimiter implements a simple in-memory rate limiter using sliding window
type RateLimiter struct {
	mu       sync.RWMutex
	visitors map[string]*Visitor
	limit    int
	window   time.Duration
}

// Visitor tracks requests from a single IP address
type Visitor struct {
	requests  []time.Time
	blockedUntil time.Time
}

// NewRateLimiter creates a new rate limiter
// limit: maximum number of requests
// window: time window for counting requests
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*Visitor),
		limit:    limit,
		window:   window,
	}

	// Start cleanup goroutine
	go rl.cleanup()

	return rl
}

// Allow checks if a request from the given IP should be allowed
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	visitor, exists := rl.visitors[ip]
	if !exists {
		visitor = &Visitor{
			requests: []time.Time{now},
		}
		rl.visitors[ip] = visitor
		return true
	}

	// Check if IP is temporarily blocked
	if now.Before(visitor.blockedUntil) {
		logger.SecurityLog("rate_limit_blocked", 0, ip, map[string]interface{}{
			"blocked_until": visitor.blockedUntil,
		})
		return false
	}

	// Remove requests outside the window
	cutoff := now.Add(-rl.window)
	validRequests := []time.Time{}
	for _, reqTime := range visitor.requests {
		if reqTime.After(cutoff) {
			validRequests = append(validRequests, reqTime)
		}
	}

	// Check if limit exceeded
	if len(validRequests) >= rl.limit {
		// Block for 15 minutes after exceeding limit
		visitor.blockedUntil = now.Add(15 * time.Minute)

		logger.SecurityLog("rate_limit_exceeded", 0, ip, map[string]interface{}{
			"requests": len(validRequests),
			"limit":    rl.limit,
			"window":   rl.window.String(),
		})

		return false
	}

	// Add current request
	visitor.requests = append(validRequests, now)
	rl.visitors[ip] = visitor

	return true
}

// cleanup removes old visitor entries periodically
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		cutoff := now.Add(-24 * time.Hour)

		for ip, visitor := range rl.visitors {
			// Remove visitors with no recent requests
			if len(visitor.requests) == 0 ||
			   (visitor.requests[len(visitor.requests)-1].Before(cutoff) && now.After(visitor.blockedUntil)) {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// Middleware returns a Fiber middleware function for rate limiting
func (rl *RateLimiter) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		ip := c.IP()

		if !rl.Allow(ip) {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests. Please try again later.",
			})
		}

		return c.Next()
	}
}

// AuthRateLimiter creates a rate limiter specifically for auth endpoints
// More strict limits: 5 attempts per 15 minutes
func AuthRateLimiter() *RateLimiter {
	return NewRateLimiter(5, 15*time.Minute)
}

// GeneralRateLimiter creates a rate limiter for general endpoints
// Less strict: 100 requests per minute
func GeneralRateLimiter() *RateLimiter {
	return NewRateLimiter(100, 1*time.Minute)
}
