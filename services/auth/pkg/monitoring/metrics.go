package monitoring

import (
	"sync"
	"time"

	"school-erp/auth/pkg/logger"
)

// Metrics holds various application metrics
type Metrics struct {
	mu                  sync.RWMutex
	AuditLogFailures    int64
	AuditLogSuccesses   int64
	LoginAttempts       int64
	LoginSuccesses      int64
	LoginFailures       int64
	RegistrationAttempts int64
	TokenRefreshes      int64
	ActiveSessions      int64
	LastAuditFailure    time.Time
	LastLogin           time.Time
}

var (
	globalMetrics *Metrics
	once          sync.Once
)

// GetMetrics returns the singleton metrics instance
func GetMetrics() *Metrics {
	once.Do(func() {
		globalMetrics = &Metrics{}
		// Start monitoring goroutine
		go globalMetrics.monitorAuditFailures()
	})
	return globalMetrics
}

// RecordAuditLogFailure records an audit log failure
func (m *Metrics) RecordAuditLogFailure() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.AuditLogFailures++
	m.LastAuditFailure = time.Now()

	// Log warning if failures are high
	if m.AuditLogFailures % 10 == 0 {
		logger.Logger.Warn().
			Int64("total_failures", m.AuditLogFailures).
			Time("last_failure", m.LastAuditFailure).
			Msg("HIGH AUDIT LOG FAILURE COUNT")
	}
}

// RecordAuditLogSuccess records a successful audit log
func (m *Metrics) RecordAuditLogSuccess() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.AuditLogSuccesses++
}

// RecordLoginAttempt records a login attempt
func (m *Metrics) RecordLoginAttempt(success bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.LoginAttempts++
	m.LastLogin = time.Now()

	if success {
		m.LoginSuccesses++
		m.ActiveSessions++
	} else {
		m.LoginFailures++
	}
}

// RecordRegistration records a registration attempt
func (m *Metrics) RecordRegistration() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.RegistrationAttempts++
}

// RecordTokenRefresh records a token refresh
func (m *Metrics) RecordTokenRefresh() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.TokenRefreshes++
}

// RecordLogout records a user logout
func (m *Metrics) RecordLogout() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.ActiveSessions > 0 {
		m.ActiveSessions--
	}
}

// GetStats returns current metrics as a map
func (m *Metrics) GetStats() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var failureRate float64
	totalAuditLogs := m.AuditLogSuccesses + m.AuditLogFailures
	if totalAuditLogs > 0 {
		failureRate = float64(m.AuditLogFailures) / float64(totalAuditLogs) * 100
	}

	var loginSuccessRate float64
	if m.LoginAttempts > 0 {
		loginSuccessRate = float64(m.LoginSuccesses) / float64(m.LoginAttempts) * 100
	}

	return map[string]interface{}{
		"audit_logs": map[string]interface{}{
			"failures":      m.AuditLogFailures,
			"successes":     m.AuditLogSuccesses,
			"failure_rate":  failureRate,
			"last_failure":  m.LastAuditFailure,
		},
		"authentication": map[string]interface{}{
			"login_attempts":   m.LoginAttempts,
			"login_successes":  m.LoginSuccesses,
			"login_failures":   m.LoginFailures,
			"success_rate":     loginSuccessRate,
			"last_login":       m.LastLogin,
		},
		"sessions": map[string]interface{}{
			"active_count": m.ActiveSessions,
		},
		"registrations": map[string]interface{}{
			"total": m.RegistrationAttempts,
		},
		"tokens": map[string]interface{}{
			"refreshes": m.TokenRefreshes,
		},
	}
}

// monitorAuditFailures runs a background goroutine to monitor audit log failures
func (m *Metrics) monitorAuditFailures() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		m.mu.RLock()
		failures := m.AuditLogFailures
		successes := m.AuditLogSuccesses
		lastFailure := m.LastAuditFailure
		m.mu.RUnlock()

		totalLogs := failures + successes
		if totalLogs == 0 {
			continue
		}

		failureRate := float64(failures) / float64(totalLogs) * 100

		// Alert if failure rate is high
		if failureRate > 5.0 && failures > 10 {
			logger.Logger.Error().
				Int64("failures", failures).
				Int64("successes", successes).
				Float64("failure_rate", failureRate).
				Time("last_failure", lastFailure).
				Msg("CRITICAL: High audit log failure rate detected")

			// You could send alerts here (email, Slack, PagerDuty, etc.)
		} else if failureRate > 1.0 && failures > 5 {
			logger.Logger.Warn().
				Int64("failures", failures).
				Int64("successes", successes).
				Float64("failure_rate", failureRate).
				Msg("WARNING: Audit log failures detected")
		}
	}
}

// Health returns a health status based on metrics
func (m *Metrics) Health() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	status := "healthy"
	issues := []string{}

	// Check audit log failure rate
	totalAuditLogs := m.AuditLogSuccesses + m.AuditLogFailures
	if totalAuditLogs > 0 {
		failureRate := float64(m.AuditLogFailures) / float64(totalAuditLogs) * 100
		if failureRate > 10.0 {
			status = "unhealthy"
			issues = append(issues, "high audit log failure rate")
		} else if failureRate > 5.0 {
			status = "degraded"
			issues = append(issues, "elevated audit log failure rate")
		}
	}

	// Check login failure rate
	if m.LoginAttempts > 0 {
		loginFailureRate := float64(m.LoginFailures) / float64(m.LoginAttempts) * 100
		if loginFailureRate > 50.0 && m.LoginAttempts > 100 {
			status = "degraded"
			issues = append(issues, "high login failure rate - possible attack")
		}
	}

	return map[string]interface{}{
		"status": status,
		"issues": issues,
	}
}
