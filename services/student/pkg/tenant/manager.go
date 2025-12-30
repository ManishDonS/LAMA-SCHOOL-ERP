package tenant

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
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

	// Create connection pool config from defaults
	config, err := pgxpool.ParseConfig("")
	if err != nil {
		return nil, fmt.Errorf("failed to parse default config: %w", err)
	}

	// Set credentials directly to mitigate DSN exposure risks
	config.ConnConfig.Host = host
	config.ConnConfig.Port = uint16(port)
	config.ConnConfig.User = user
	config.ConnConfig.Password = password
	config.ConnConfig.Database = dbName
	config.ConnConfig.ConnectTimeout = tm.connectionTimeout
	config.ConnConfig.RuntimeParams = map[string]string{
		"application_name": "LAMA-ERP-Student-Tenant-" + schoolCode,
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

// CreateTenantDatabase creates a new tenant database and user
func (tm *TenantManager) CreateTenantDatabase(ctx context.Context, mainDB *pgxpool.Pool, schoolCode, dbName, dbUser, dbPassword string) error {
	// Encrypt password for storage
	encryptedPassword, err := tm.cipher.Encrypt(dbPassword)
	if err != nil {
		return fmt.Errorf("failed to encrypt password: %w", err)
	}
	_ = encryptedPassword // Will be used when saving to main DB

	// Create user if it doesn't exist using safe EXECUTE format() pattern
	createUserSQL := `
		DO $$
		BEGIN
			IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = $1) THEN
				EXECUTE format('CREATE USER %I WITH PASSWORD %L', $1, $2);
			END IF;
		END
		$$;
	`

	if _, err := mainDB.Exec(ctx, createUserSQL, dbUser, dbPassword); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Create database safely with identifier quoting
	createDBSQL := fmt.Sprintf("CREATE DATABASE %s", pgx.Identifier{dbName}.Sanitize())
	if _, err := mainDB.Exec(ctx, createDBSQL); err != nil {
		return fmt.Errorf("failed to create database: %w", err)
	}

	// Grant privileges safely
	grantSQL := fmt.Sprintf("GRANT ALL PRIVILEGES ON DATABASE %s TO %s",
		pgx.Identifier{dbName}.Sanitize(),
		pgx.Identifier{dbUser}.Sanitize())
	if _, err := mainDB.Exec(ctx, grantSQL); err != nil {
		return fmt.Errorf("failed to grant database privileges: %w", err)
	}

	// Connect to the new database safely using pgxpool.Config
	config, _ := pgxpool.ParseConfig("")
	config.ConnConfig.Host = "postgres"
	config.ConnConfig.Port = 5432
	config.ConnConfig.User = "postgres"
	config.ConnConfig.Password = tm.postgresPassword
	config.ConnConfig.Database = dbName

	tenantConn, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return fmt.Errorf("failed to connect to tenant database: %w", err)
	}
	defer tenantConn.Close()

	// Grant schema permissions safely using Identifier quoting
	schemaSQL := fmt.Sprintf(`
		GRANT ALL ON SCHEMA public TO %s;
		GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %s;
		GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %s;
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %s;
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %s;
	`,
		pgx.Identifier{dbUser}.Sanitize(),
		pgx.Identifier{dbUser}.Sanitize(),
		pgx.Identifier{dbUser}.Sanitize(),
		pgx.Identifier{dbUser}.Sanitize(),
		pgx.Identifier{dbUser}.Sanitize())

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

	// Drop database safely
	dropDBSQL := fmt.Sprintf("DROP DATABASE IF EXISTS %s WITH (FORCE);", pgx.Identifier{dbName}.Sanitize())

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
