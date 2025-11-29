# School Service Integration Guide

## Quick Start

### For API Gateway Integration

The School Service integrates with the API Gateway to route tenant-specific requests to the correct school database.

#### 1. Update API Gateway Configuration

In your `backend/api-gateway/index.js`:

```javascript
const services = {
  // ... other services
  school: `http://school-service:${process.env.SCHOOL_SERVICE_PORT || 3011}`,
};

// Add school routes
app.use('/api/v1/schools', createProxyMiddleware({
  target: services.school,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // SuperAdmin operations - route directly
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && path === '/api/v1/schools') {
      return path;
    }
    // For other services that need tenant resolution
    // Add X-Tenant-Code header
    const tenantCode = req.headers['x-tenant-code'] ||
                       req.query.tenant_code ||
                       extractSubdomainFromHost(req.hostname);
    if (tenantCode && !req.headers['x-tenant-code']) {
      req.headers['x-tenant-code'] = tenantCode;
    }
    return path;
  },
}));
```

#### 2. Update Docker Compose

In your main `docker-compose.yml`:

```yaml
services:
  school-service:
    build:
      context: ./services/school
      dockerfile: Dockerfile
    container_name: school-service
    ports:
      - "3011:3011"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: school_erp_main
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY:-your-32-byte-key}
      JWT_SECRET: ${JWT_SECRET:-your-jwt-secret}
      MAX_CONNECTIONS: 25
      CONN_MAX_LIFETIME: 5m
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - school-erp
    restart: unless-stopped
```

### For Other Microservices

#### User Service Integration

To make the user service tenant-aware:

```go
// In user-service/main.go
import "school-erp/school/middleware"
import "school-erp/school/pkg/tenant"

func setupUserService(app *fiber.App, mainDB *pgxpool.Pool) {
    // Create tenant manager
    cfg := config.LoadConfig()
    tenantManager := tenant.NewTenantManager(
        cfg.EncryptionKey,
        cfg.MaxConnections,
        cfg.ConnMaxLifetime,
    )

    // Create and register tenant resolver middleware
    tenantResolver := middleware.NewTenantResolver(middleware.TenantResolverConfig{
        TenantManager: tenantManager,
        MainDB:        mainDB,
        DBHost:        cfg.DBHost,
        DBPort:        cfg.DBPort,
    })

    // Apply to protected routes
    api := app.Group("/api/v1")

    // Public routes (no tenant resolution needed)
    api.Post("/auth/login", handlers.Login)
    api.Post("/auth/register", handlers.Register)

    // Protected routes (tenant resolution required)
    users := api.Group("/users")
    users.Use(tenantResolver)
    users.Get("", handlers.GetUsers)
    users.Get("/:id", handlers.GetUser)
    users.Post("", handlers.CreateUser)
    users.Put("/:id", handlers.UpdateUser)
    users.Delete("/:id", handlers.DeleteUser)
}
```

#### Handler Implementation

```go
// In user-service/handlers/user.go
func GetUsers(c *fiber.Ctx) error {
    // Get tenant database from context
    tenantDB := middleware.GetTenantDB(c)
    tenantCode := middleware.GetTenantCode(c)

    if tenantDB == nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to get tenant database connection",
        })
    }

    ctx := context.Background()
    rows, err := tenantDB.Query(ctx, "SELECT id, email, role FROM users")
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to fetch users",
        })
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Email, &user.Role); err != nil {
            continue
        }
        users = append(users, user)
    }

    return c.JSON(fiber.Map{
        "data": users,
        "tenant_code": tenantCode,
    })
}
```

### Environment Variables

Create `.env` files for each service:

#### Main `.env` (root directory)
```bash
# Application
ENVIRONMENT=development
APP_PORT=8080

# Database
DB_USER=postgres
DB_PASSWORD=postgres_secure_password
DB_HOST=postgres
DB_PORT=5432

# Encryption & Security
ENCRYPTION_KEY=your-32-byte-encryption-key-change-this
JWT_SECRET=your-jwt-secret-key-change-this

# Redis
REDIS_PASSWORD=redis_password

# Services
SCHOOL_SERVICE_PORT=3011
USER_SERVICE_PORT=3002
AUTH_SERVICE_PORT=3002
```

#### School Service `.env`
```bash
# From parent .env via docker-compose
ENVIRONMENT=development
APP_PORT=3011
DB_HOST=postgres
DB_PORT=5432
DB_NAME=school_erp_main
DB_USER=postgres
DB_PASSWORD=postgres_secure_password
ENCRYPTION_KEY=your-32-byte-encryption-key-change-this
JWT_SECRET=your-jwt-secret-key-change-this
MAX_CONNECTIONS=25
CONN_MAX_LIFETIME=5m
REDIS_HOST=redis
REDIS_PORT=6379
```

## Testing the Integration

### 1. Test School Creation (SuperAdmin)

```bash
curl -X POST http://localhost:8080/api/v1/schools \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN" \
  -d '{
    "name": "Test School",
    "code": "test",
    "domain": "test.school-erp.com",
    "timezone": "Asia/Kolkata",
    "db_user": "school_test",
    "db_password": "SecurePassword123!@#",
    "logo_url": "https://example.com/logo.png"
  }'
```

Expected response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test School",
  "code": "test",
  "db_name": "school_test_db",
  "domain": "test.school-erp.com",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. Test Tenant-Aware Request

```bash
# Using header
curl -X GET http://localhost:8080/api/v1/users \
  -H "X-Tenant-Code: test" \
  -H "Authorization: Bearer USER_TOKEN"

# Using query parameter
curl -X GET "http://localhost:8080/api/v1/users?tenant_code=test" \
  -H "Authorization: Bearer USER_TOKEN"

# Using subdomain
curl -X GET http://test.school-erp.local/api/v1/users \
  -H "Authorization: Bearer USER_TOKEN"
```

### 3. Test Health Checks

```bash
# School Service health
curl http://localhost:3011/health

# School Service statistics
curl http://localhost:3011/api/v1/schools/test/stats
```

## Deployment Checklist

### Pre-Deployment

- [ ] Set secure ENCRYPTION_KEY (32 bytes)
- [ ] Set secure JWT_SECRET
- [ ] Configure database credentials
- [ ] Set ENVIRONMENT=production
- [ ] Update API Gateway routing config
- [ ] Test all endpoints in staging
- [ ] Review security settings
- [ ] Setup monitoring and logging

### Docker Deployment

```bash
# 1. Build all services
docker-compose build

# 2. Run services
docker-compose up -d

# 3. Verify health
curl http://localhost:3011/health
curl http://localhost:8080/health

# 4. Check logs
docker-compose logs -f school-service
docker-compose logs -f api-gateway
```

### Kubernetes Deployment

```bash
# 1. Create secrets
kubectl create secret generic school-service-secrets \
  --from-literal=encryption_key='your-32-byte-key' \
  --from-literal=jwt_secret='your-jwt-secret'

# 2. Create configmap
kubectl create configmap school-service-config \
  --from-literal=db_host='postgres-service' \
  --from-literal=db_port='5432'

# 3. Deploy
kubectl apply -f k8s/school-service-deployment.yaml
kubectl apply -f k8s/school-service-service.yaml

# 4. Verify deployment
kubectl get pods -l app=school-service
kubectl logs -f deployment/school-service
```

## Monitoring & Logging

### Health Monitoring

Monitor the health endpoint periodically:

```bash
# Every 30 seconds
watch -n 30 'curl -s http://localhost:3011/health | jq'
```

### Connection Pool Monitoring

Check connection pool statistics:

```bash
curl http://localhost:3011/api/v1/schools/{school_code}/stats | jq '.stats'
```

### Logging

All operations are logged to stdout. Configure logging level via environment:

```bash
# In production, use structured logging
export LOG_LEVEL=info
```

Sample logs:
```
2024-01-15 10:30:00 - POST /api/v1/schools - 201 - 245ms
2024-01-15 10:30:15 - GET /api/v1/schools - 200 - 12ms
2024-01-15 10:30:45 - PUT /api/v1/schools/{id} - 200 - 89ms
```

### Error Tracking

Monitor error rates:

```bash
# View error logs
docker-compose logs school-service | grep -i error

# Count errors
docker-compose logs school-service | grep -i error | wc -l
```

## Troubleshooting Integration Issues

### Issue: "Tenant code is required"

**Solution**: Ensure tenant code is provided via:
- Header: `X-Tenant-Code: eis`
- Query param: `?tenant_code=eis`
- Subdomain: `eis.school-erp.com`

### Issue: "School not found or inactive"

**Solution**:
1. Verify school exists: `SELECT * FROM schools WHERE code = 'eis';`
2. Check status is 'active': Update via PUT if needed
3. Verify database exists: `\l` in psql

### Issue: "Failed to connect to tenant database"

**Solution**:
1. Check tenant database exists: `\l | grep school_eis_db`
2. Verify credentials are correct
3. Check network connectivity to database
4. Review logs: `docker-compose logs school-service`

### Issue: Connection pool exhausted

**Solution**:
1. Monitor active connections: `/api/v1/schools/{code}/stats`
2. Increase MAX_CONNECTIONS if needed
3. Check for connection leaks in handlers
4. Review query performance and optimize

## Advanced Configuration

### Connection Pool Tuning

For high-load environments:

```bash
# Increase connection pool
MAX_CONNECTIONS=50
CONN_MAX_LIFETIME=10m

# For low-resource environments
MAX_CONNECTIONS=10
CONN_MAX_LIFETIME=3m
```

### Multi-Region Deployment

For multi-region setup:

```yaml
# Each region maintains its own main database
# but shares the same global schools registry

region:
  us-east-1:
    db_host: postgres.us-east-1.rds.amazonaws.com
  eu-west-1:
    db_host: postgres.eu-west-1.rds.amazonaws.com
```

## Support & Maintenance

- Regular backups of main database
- Monitor disk space for tenant databases
- Cleanup inactive schools periodically
- Review and update encryption keys yearly
- Keep Go and dependencies updated

For detailed API documentation, see [MULTI_TENANT_GUIDE.md](./MULTI_TENANT_GUIDE.md)
