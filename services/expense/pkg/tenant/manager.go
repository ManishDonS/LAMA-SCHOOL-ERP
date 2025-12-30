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
}

// NewTenantManager creates a new tenant manager
func NewTenantManager(encryptionKey string, maxOpenConns, maxIdleConns int32, connMaxLifetime time.Duration) (*TenantManager, error) {
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
	}, nil
}

// GetConnection retrieves a database connection for a tenant
func (tm *TenantManager) GetConnection(ctx context.Context, schoolCode string, host string, port int, dbName, user, encryptedPassword string, onConnect func(*pgxpool.Pool) error) (*pgxpool.Pool, error) {
	// 1. Fast path: check cache with read lock
	tm.dbMutex.RLock()
	if conn, exists := tm.dbConnections[schoolCode]; exists {
		if err := conn.Ping(ctx); err == nil {
			tm.dbMutex.RUnlock()
			return conn, nil
		}
		tm.dbMutex.RUnlock()
		// If ping fails, we fall through to create a new one
	} else {
		tm.dbMutex.RUnlock()
	}

	// 2. Slow path: acquire write lock to create/migrate
	tm.dbMutex.Lock()
	defer tm.dbMutex.Unlock()

	// 3. Double-check cache inside write lock
	if conn, exists := tm.dbConnections[schoolCode]; exists {
		if err := conn.Ping(ctx); err == nil {
			return conn, nil
		}
		// If ping fails again, clean up old connection
		conn.Close()
		delete(tm.dbConnections, schoolCode)
	}

	// 4. Decrypt password
	password, err := tm.cipher.Decrypt(encryptedPassword)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt password: %w", err)
	}

	// 5. Create new connection
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		url.QueryEscape(user),
		url.QueryEscape(password),
		host,
		port,
		url.QueryEscape(dbName),
	)

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DSN: %w", err)
	}

	config.MaxConns = tm.maxOpenConns
	config.MinConns = 1
	config.MaxConnLifetime = tm.connMaxLifetime
	config.ConnConfig.ConnectTimeout = tm.connectionTimeout

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// 6. Run connection callback (migrations) while holding lock
	// This ensures only one migration runs at a time for the entire service
	if onConnect != nil {
		if err := onConnect(pool); err != nil {
			pool.Close()
			return nil, fmt.Errorf("failed to run connection callback: %w", err)
		}
	}

	// 7. Cache the connection
	tm.dbConnections[schoolCode] = pool

	return pool, nil
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
