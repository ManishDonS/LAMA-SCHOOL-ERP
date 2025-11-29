# Multi-Tenant School Service Documentation

## Overview

The School Service is a comprehensive multi-tenant management system for the School ERP platform. It provides:

- **Global School Registry**: Central metadata store for all schools
- **Per-School Databases**: Automatic database provisioning for each school
- **Dynamic Tenant Routing**: Middleware-based tenant resolution from requests
- **Secure Credentials**: AES-256-GCM encryption for database credentials
- **Connection Pooling**: Efficient pgx/v5 connection management with caching
- **Automatic Migrations**: Predefined schemas for each tenant database
- **SuperAdmin Management**: CRUD operations for school configuration

## Architecture

### Multi-Tenancy Pattern

```
┌─────────────────────────────────────────┐
│         API Gateway (Port 8080)         │
│   - Route requests to services          │
│   - Add X-Tenant-Code header           │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
     ▼                   ▼
┌─────────────┐   ┌────────────────────────┐
│    School   │   │  Other Services        │
│   Service   │   │  (Auth, Students, etc) │
│ (Port 3011) │   │   Tenant Resolver      │
└──────┬──────┘   │   Middleware           │
       │          └────────┬───────────────┘
       │                   │
       └───────────┬───────┘
                   │
         ┌─────────▼─────────────┐
         │  Main PostgreSQL DB   │
         │  - schools metadata   │
         │  - credentials (enc)  │
         │  (school_erp_main)    │
         └───────┬───────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│school_  │ │school_  │ │school_  │
│eis_db   │ │kmc_db   │ │ams_db   │
│(Tenant) │ │(Tenant) │ │(Tenant) │
└─────────┘ └─────────┘ └─────────┘
```

### Components

1. **School Service** (Main server running on port 3011)
   - Handles school management operations
   - Manages tenant database lifecycle
   - Provides SuperAdmin APIs

2. **Tenant Manager** (`pkg/tenant/manager.go`)
   - Creates/drops tenant databases
   - Manages connection pooling
   - Handles credential encryption/decryption
   - Maintains connection cache

3. **Tenant Resolver Middleware** (`middleware/tenant_resolver.go`)
   - Extracts tenant code from requests
   - Resolves tenant database connection
   - Stores in request context for handlers

4. **Database Encryption** (`pkg/tenant/crypto.go`)
   - AES-256-GCM encryption for credentials
   - Secure random nonce generation
   - Base64 encoding for storage

## Getting Started

### Prerequisites

- Go 1.21+
- PostgreSQL 13+
- Docker & Docker Compose (optional, for containerized deployment)

### Environment Variables

Create a `.env` file in the service directory:

```bash
# Application
APP_PORT=3011
ENVIRONMENT=development

# Main Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_erp_main
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Connection Pool
MAX_CONNECTIONS=25
CONN_MAX_LIFETIME=5m

# Security
ENCRYPTION_KEY=your-32-byte-encryption-key-here-1234
JWT_SECRET=your-jwt-secret-key-here

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### Local Setup

1. **Initialize the main database**:
```bash
createdb -U postgres school_erp_main
```

2. **Run the service**:
```bash
go run main.go
```

The service will automatically:
- Create the `schools` table in the main database
- Setup indexes and triggers
- Start listening on port 3011

### Docker Setup

1. **Build and run with Docker Compose**:
```bash
docker-compose up -d
```

2. **View logs**:
```bash
docker-compose logs -f school-service
```

3. **Stop the service**:
```bash
docker-compose down
```

## API Reference

### School Management Endpoints

All school management endpoints require SuperAdmin authentication.

#### Create School
```http
POST /api/v1/schools
Content-Type: application/json

{
  "name": "Example International School",
  "code": "eis",
  "domain": "eis.school-erp.com",
  "logo_url": "https://example.com/logo.png",
  "timezone": "Asia/Kolkata",
  "db_user": "school_eis",
  "db_password": "SecurePassword123!@#"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Example International School",
  "code": "eis",
  "db_name": "school_eis_db",
  "domain": "eis.school-erp.com",
  "logo_url": "https://example.com/logo.png",
  "timezone": "Asia/Kolkata",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### List Schools
```http
GET /api/v1/schools?limit=10&offset=0
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Example International School",
      "code": "eis",
      "db_name": "school_eis_db",
      "domain": "eis.school-erp.com",
      "logo_url": "https://example.com/logo.png",
      "timezone": "Asia/Kolkata",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0
  }
}
```

#### Get School Details
```http
GET /api/v1/schools/{id}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Example International School",
  "code": "eis",
  "db_name": "school_eis_db",
  "domain": "eis.school-erp.com",
  "logo_url": "https://example.com/logo.png",
  "timezone": "Asia/Kolkata",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Update School
```http
PUT /api/v1/schools/{id}
Content-Type: application/json

{
  "name": "Updated School Name",
  "domain": "new-domain.school-erp.com",
  "status": "active"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated School Name",
  "code": "eis",
  "db_name": "school_eis_db",
  "domain": "new-domain.school-erp.com",
  "logo_url": "https://example.com/logo.png",
  "timezone": "Asia/Kolkata",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:40:00Z"
}
```

#### Delete School
```http
DELETE /api/v1/schools/{id}
```

**Response** (200 OK):
```json
{
  "message": "School deleted successfully"
}
```

The tenant database will be dropped asynchronously after deletion.

#### Get School Statistics
```http
GET /api/v1/schools/{code}/stats
```

**Response** (200 OK):
```json
{
  "school_code": "eis",
  "stats": {
    "total_conns": 5,
    "idle_conns": 3,
    "max_conns": 25,
    "min_conns": 1,
    "connection_pool_status": "healthy"
  }
}
```

### Health Check
```http
GET /health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "school-service"
}
```

## Using Tenant Resolver Middleware

### For Other Microservices

To use the tenant resolver middleware in other services (e.g., user-service, attendance-service):

1. **Import the middleware**:
```go
import "school-erp/school/middleware"
```

2. **Register the middleware**:
```go
// In your main service setup
tenantMiddleware := middleware.NewTenantResolver(middleware.TenantResolverConfig{
    TenantManager: tenantManager,
    MainDB:        mainDB,
    DBHost:        dbHost,
    DBPort:        dbPort,
})

// Apply to protected routes
app.Use("/api/v1/protected/*", tenantMiddleware)
```

3. **Access tenant info in handlers**:
```go
func GetStudents(c *fiber.Ctx) error {
    tenantCode := middleware.GetTenantCode(c)
    tenantDB := middleware.GetTenantDB(c)

    // Use tenantDB for all database operations
    rows, err := tenantDB.Query(context.Background(),
        "SELECT * FROM students WHERE tenant_code = $1", tenantCode)
    // ... rest of handler
}
```

### Tenant Code Resolution Order

The middleware resolves tenant code in this order:

1. **X-Tenant-Code Header**:
```http
GET /api/v1/students
X-Tenant-Code: eis
```

2. **Query Parameter**:
```http
GET /api/v1/students?tenant_code=eis
```

3. **Subdomain**:
```http
GET http://eis.school-erp.com/api/v1/students
```

## Database Schema

### Main Database (school_erp_main)

```sql
CREATE TABLE schools (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    db_name VARCHAR(100) NOT NULL UNIQUE,
    db_user VARCHAR(100) NOT NULL,
    db_password TEXT NOT NULL,  -- Encrypted
    db_host VARCHAR(255) NOT NULL,
    db_port INTEGER NOT NULL DEFAULT 5432,
    domain VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tenant Databases (school_{code}_db)

Each tenant database includes:

**users table**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- admin, teacher, student, parent
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**students table**:
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    user_id UUID,
    roll_number VARCHAR(50),
    class VARCHAR(50),
    section VARCHAR(10),
    date_of_birth DATE,
    parent_contact VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**attendance table**:
```sql
CREATE TABLE attendance (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,  -- present, absent, late, excused
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, date)
);
```

## Security Best Practices

1. **Encryption Keys**:
   - Use a secure 32-byte encryption key
   - Rotate keys periodically
   - Store in secure secret management (AWS Secrets Manager, HashiCorp Vault)

2. **Database Credentials**:
   - Always encrypted in storage
   - Unique per tenant
   - Minimum 8 characters, strong passwords recommended

3. **Access Control**:
   - Validate tenant code before database access
   - Use JWT for authentication
   - Implement role-based access control (RBAC)

4. **Network Security**:
   - Use HTTPS in production
   - Implement rate limiting on school creation
   - Use VPC/network isolation for databases

5. **Monitoring**:
   - Log all school management operations
   - Monitor connection pool health
   - Set up alerts for failed authentications

## Deployment

### Kubernetes Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: school-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: school-service
  template:
    metadata:
      labels:
        app: school-service
    spec:
      containers:
      - name: school-service
        image: school-erp/school-service:latest
        ports:
        - containerPort: 3011
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: school-service-config
              key: db_host
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: school-service-secrets
              key: encryption_key
        livenessProbe:
          httpGet:
            path: /health
            port: 3011
          initialDelaySeconds: 40
          periodSeconds: 10
```

## Troubleshooting

### Common Issues

**1. Failed to connect to tenant database**
- Verify database credentials are correct
- Check if tenant database exists
- Ensure network connectivity to database

**2. School not found or inactive**
- Verify school code is correct
- Check school status is 'active'
- Ensure school exists in main database

**3. Connection pool exhausted**
- Monitor pool statistics via `/api/v1/schools/{code}/stats`
- Increase MAX_CONNECTIONS if needed
- Check for connection leaks in handlers

**4. Encryption/Decryption errors**
- Verify ENCRYPTION_KEY is 32 bytes
- Check password format requirements
- Ensure database password hasn't been corrupted

## Performance Optimization

1. **Connection Pooling**:
   - Configure MAX_CONNECTIONS based on workload
   - Adjust MIN_CONNS for faster response times
   - Monitor idle connection count

2. **Caching**:
   - School credentials cached in memory
   - Connection objects cached per tenant
   - Consider Redis for distributed caching

3. **Database Indexes**:
   - Indexes created on code, status, domain, created_at
   - Use `EXPLAIN ANALYZE` for query optimization

4. **Query Optimization**:
   - Use pagination for list endpoints
   - Limit offset to 100 schools max
   - Add filters for large result sets

## Contributing

When adding new features:

1. Follow Go conventions and style
2. Add comprehensive error handling
3. Include database migrations if needed
4. Update documentation
5. Add tests for new functionality

## Support

For issues or questions, contact the development team or create an issue in the repository.
