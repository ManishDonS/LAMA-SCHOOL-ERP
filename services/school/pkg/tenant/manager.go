package tenant

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TenantManager manages tenant database connections and caching
type TenantManager struct {
	cipher              *Cipher
	dbConnections       map[string]*pgxpool.Pool // Cache of tenant DB connections
	dbMutex             sync.RWMutex
	maxOpenConns        int32
	maxIdleConns        int32
	connMaxLifetime     time.Duration
	connectionTimeout   time.Duration
	postgresPassword    string // Superuser password for granting permissions
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
func (tm *TenantManager) GetConnection(ctx context.Context, schoolCode string, host string, port int, dbName, user, encryptedPassword string) (*pgxpool.Pool, error) {
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
		user,
		password,
		host,
		port,
		dbName,
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

	// Cache the connection
	tm.dbMutex.Lock()
	tm.dbConnections[schoolCode] = pool
	tm.dbMutex.Unlock()

	return pool, nil
}

// CreateTenantDatabase creates a new tenant database and user
func (tm *TenantManager) CreateTenantDatabase(ctx context.Context, mainDB *pgxpool.Pool, schoolCode, dbName, dbUser, dbPassword string) error {
	// Encrypt password for storage
	encryptedPassword, err := tm.cipher.Encrypt(dbPassword)
	if err != nil {
		return fmt.Errorf("failed to encrypt password: %w", err)
	}
	_ = encryptedPassword // Will be used when saving to main DB

	// Create user if it doesn't exist
	createUserSQL := fmt.Sprintf(`
		DO $$
		BEGIN
			IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '%s') THEN
				CREATE USER "%s" WITH PASSWORD '%s';
			END IF;
		END
		$$;
	`, dbUser, dbUser, dbPassword)

	if _, err := mainDB.Exec(ctx, createUserSQL); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Create database
	createDBSQL := fmt.Sprintf(`CREATE DATABASE "%s" ENCODING 'UTF8' TEMPLATE template0;`, dbName)

	if _, err := mainDB.Exec(ctx, createDBSQL); err != nil {
		return fmt.Errorf("failed to create database: %w", err)
	}

	// Grant privileges to user on database
	grantSQL := fmt.Sprintf(`GRANT ALL PRIVILEGES ON DATABASE "%s" TO "%s";`, dbName, dbUser)

	if _, err := mainDB.Exec(ctx, grantSQL); err != nil {
		return fmt.Errorf("failed to grant database privileges: %w", err)
	}

	// Connect to the new database to grant schema permissions
	tenantDSN := fmt.Sprintf(
		"postgres://postgres:%s@%s:%d/%s?sslmode=disable",
		tm.postgresPassword, // Use superuser to grant permissions
		"postgres",
		5432,
		dbName,
	)

	tenantConn, err := pgxpool.New(ctx, tenantDSN)
	if err != nil {
		return fmt.Errorf("failed to connect to tenant database: %w", err)
	}
	defer tenantConn.Close()

	// Grant schema permissions
	schemaSQL := fmt.Sprintf(`
		GRANT ALL ON SCHEMA public TO "%s";
		GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "%s";
		GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "%s";
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "%s";
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "%s";
	`, dbUser, dbUser, dbUser, dbUser, dbUser)

	if _, err := tenantConn.Exec(ctx, schemaSQL); err != nil {
		return fmt.Errorf("failed to grant schema privileges: %w", err)
	}

	return nil
}

// DropTenantDatabase drops a tenant database
func (tm *TenantManager) DropTenantDatabase(ctx context.Context, mainDB *pgxpool.Pool, schoolCode, dbName string) error {
	// Close connection if exists
	tm.dbMutex.Lock()
	if conn, exists := tm.dbConnections[schoolCode]; exists {
		conn.Close()
		delete(tm.dbConnections, schoolCode)
	}
	tm.dbMutex.Unlock()

	// Drop database
	dropDBSQL := fmt.Sprintf(`DROP DATABASE IF EXISTS "%s" WITH (FORCE);`, dbName)

	if _, err := mainDB.Exec(ctx, dropDBSQL); err != nil {
		return fmt.Errorf("failed to drop database: %w", err)
	}

	return nil
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

// GetStats returns connection pool statistics
func (tm *TenantManager) GetStats(schoolCode string) map[string]interface{} {
	tm.dbMutex.RLock()
	defer tm.dbMutex.RUnlock()

	if conn, exists := tm.dbConnections[schoolCode]; exists {
		stat := conn.Stat()
		return map[string]interface{}{
			"total_conns":    stat.TotalConns(),
			"idle_conns":     stat.IdleConns(),
			"acq_count":      stat.AcquiredConns(),
			"acquired_conns": stat.AcquiredConns(),
		}
	}

	return nil
}

// EncryptPassword encrypts a password using the cipher
func (tm *TenantManager) EncryptPassword(password string) (string, error) {
	return tm.cipher.Encrypt(password)
}

// DecryptPassword decrypts a password using the cipher
func (tm *TenantManager) DecryptPassword(encryptedPassword string) (string, error) {
	return tm.cipher.Decrypt(encryptedPassword)
}
