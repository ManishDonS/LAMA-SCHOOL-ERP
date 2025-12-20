package tenant

import (
	"context"
	"fmt"
	"net/url"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TenantManager manages tenant database connections and caching
type TenantManager struct {
	cipher            *Cipher
	dbConnections     map[string]*pgxpool.Pool // Cache of tenant DB connections
	dbMutex           sync.RWMutex
	maxOpenConns      int32
	maxIdleConns      int32
	connMaxLifetime   time.Duration
	connectionTimeout time.Duration
	postgresPassword  string // Superuser password for granting permissions
}

// NewTenantManager creates a new tenant manager
func NewTenantManager(encryptionKey string, maxOpenConns, maxIdleConns int32, connMaxLifetime time.Duration, postgresPassword string) (*TenantManager, error) {
	cipher, err := NewCipher(encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	return &TenantManager{
		cipher:            cipher,
		dbConnections:     make(map[string]*pgxpool.Pool),
		maxOpenConns:      maxOpenConns,
		maxIdleConns:      maxIdleConns,
		connMaxLifetime:   connMaxLifetime,
		connectionTimeout: 5 * time.Second,
		postgresPassword:  postgresPassword,
	}, nil
}

// GetConnection retrieves a database connection for a tenant (from cache or creates new)
func (tm *TenantManager) GetConnection(ctx context.Context, schoolCode string, host string, port int, dbName, user, encryptedPassword string, onConnect func(*pgxpool.Pool) error) (*pgxpool.Pool, error) {
	// Check cache first
	tm.dbMutex.RLock()
	if conn, exists := tm.dbConnections[schoolCode]; exists {
		tm.dbMutex.RUnlock()
		// Verify connection is still alive
		if err := conn.Ping(ctx); err == nil {
			return conn, nil
		}
		// Connection is dead, remove from cache and create new one
		tm.dbMutex.Lock()
		delete(tm.dbConnections, schoolCode)
		tm.dbMutex.Unlock()
	} else {
		tm.dbMutex.RUnlock()
	}

	// Decrypt password
	password, err := tm.cipher.Decrypt(encryptedPassword)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt password: %w", err)
	}

	// Create new connection
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		url.QueryEscape(user),
		url.QueryEscape(password),
		host,
		port,
		url.QueryEscape(dbName),
	)

	// Create connection pool
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DSN: %w", err)
	}

	// Configure pool
	config.MaxConns = tm.maxOpenConns
	config.MinConns = 1
	config.MaxConnLifetime = tm.connMaxLifetime
	config.ConnConfig.ConnectTimeout = tm.connectionTimeout

	// Connect with timeout
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Run connection callback (e.g., migrations)
	if onConnect != nil {
		if err := onConnect(pool); err != nil {
			pool.Close()
			return nil, fmt.Errorf("failed to run connection callback: %w", err)
		}
	}

	// Cache the connection
	tm.dbMutex.Lock()
	tm.dbConnections[schoolCode] = pool
	tm.dbMutex.Unlock()

	return pool, nil
}

// CloseConnection closes a specific tenant connection
func (tm *TenantManager) CloseConnection(schoolCode string) {
	tm.dbMutex.Lock()
	defer tm.dbMutex.Unlock()

	if conn, exists := tm.dbConnections[schoolCode]; exists {
		conn.Close()
		delete(tm.dbConnections, schoolCode)
	}
}

// CloseAllConnections closes all tenant connections
func (tm *TenantManager) CloseAllConnections() {
	tm.dbMutex.Lock()
	defer tm.dbMutex.Unlock()

	for _, conn := range tm.dbConnections {
		conn.Close()
	}
	tm.dbConnections = make(map[string]*pgxpool.Pool)
}
