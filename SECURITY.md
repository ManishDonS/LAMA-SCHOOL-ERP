# Security Policy

## Overview

LAMA School ERP takes security seriously. This document outlines our security practices, known vulnerabilities, and guidelines for secure deployment.

## Table of Contents

- [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)
- [Security Model](#security-model)
- [Authentication & Authorization](#authentication--authorization)
- [Data Encryption](#data-encryption)
- [Database Security](#database-security)
- [Network Security](#network-security)
- [Deployment Security](#deployment-security)
- [Security Fixes Implemented](#security-fixes-implemented)
- [Security Checklist](#security-checklist)

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: security@lamaerp.com (or create private security advisory)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and provide a timeline for fixes.

## Security Model

### Multi-Tenancy Architecture

LAMA ERP uses database-level multi-tenancy:

- **Database Isolation**: Each school has its own PostgreSQL database
- **Credential Encryption**: Database credentials encrypted with AES-256-GCM
- **Tenant Resolution**: Via header, subdomain, or query parameter
- **Connection Pooling**: Cached connections per tenant with health checks

### Threat Model

**Protected Against:**
- ✅ SQL Injection (parameterized queries)
- ✅ XSS (Content Security Policy, input validation)
- ✅ CSRF (SameSite cookies, CORS validation)
- ✅ Brute Force (rate limiting: 100 req/15min per IP)
- ✅ Credential Stuffing (bcrypt password hashing, cost 12)
- ✅ Session Hijacking (HttpOnly cookies, secure flags)
- ✅ Man-in-the-Middle (SSL/TLS for DB and HTTP)

**Requires Additional Protection:**
- ⚠️ DDoS attacks (implement WAF/CloudFlare)
- ⚠️ Advanced persistent threats (implement IDS/IPS)
- ⚠️ Zero-day exploits (keep dependencies updated)

## Authentication & Authorization

### Password Security

**Requirements:**
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special character
- Cannot be common password (blacklist checked)
- Hashed with bcrypt (cost factor: 12)

**Implementation:**
```go
// Location: services/auth/utils/password.go
- ValidatePasswordComplexity()
- HashPassword() using bcrypt
- ComparePasswords() with constant-time comparison
```

### JWT Token Management

**Access Tokens:**
- Lifespan: 15 minutes
- Signed with HS256 (HMAC-SHA256)
- Contains: user ID, role, school ID, permissions
- Sent via Authorization header: `Bearer <token>`

**Refresh Tokens:**
- Lifespan: 7 days
- Stored in HttpOnly cookie (prevents XSS)
- SameSite=Strict (prevents CSRF)
- Secure flag in production (HTTPS only)
- Can be revoked (stored in database)

**Token Generation:**
```bash
# Generate secure JWT secrets (minimum 256 bits)
openssl rand -base64 64
```

### Role-Based Access Control (RBAC)

Roles:
- `super_admin` - System-wide access (limited to platform operators)
- `school_admin` - Full access within school tenant
- `teacher` - Student records, attendance, grades
- `accountant` - Financial records only
- `parent` - Read-only access to own children's data
- `student` - Read-only access to own data

## Data Encryption

### Encryption at Rest

**Sensitive Data:**
- Database credentials (tenant passwords)
- Super admin passwords (in main database)
- Payment information (if implemented)

**Algorithm:** AES-256-GCM (Galois/Counter Mode)
- Provides both confidentiality and authenticity
- Random nonce per encryption operation
- Authenticated encryption (prevents tampering)

**Key Derivation:**
- Uses PBKDF2-HMAC-SHA256
- 100,000 iterations
- 256-bit derived key
- Fixed salt for system-wide encryption

**Implementation:**
```go
// Location: services/auth/pkg/tenant/crypto.go
- NewCipher() - Derives encryption key with PBKDF2
- Encrypt() - AES-256-GCM encryption
- Decrypt() - AES-256-GCM decryption
```

**Key Management:**
```bash
# Generate encryption key (256 bits / 32 bytes in hex)
openssl rand -hex 32

# Store securely:
# - Development: .env file (gitignored)
# - Production: Kubernetes secrets, AWS Secrets Manager, HashiCorp Vault
```

⚠️ **CRITICAL**: `ENCRYPTION_KEY` is REQUIRED. Service will not start without it.

### Encryption in Transit

**HTTPS/TLS:**
- All HTTP traffic should use TLS 1.2+ in production
- Configure reverse proxy (nginx, Traefik, Cloudflare)
- Redirect HTTP → HTTPS
- HSTS headers recommended

**Database TLS:**
- SSL mode configurable via `DB_SSL_MODE`
- Development: `prefer` (use if available)
- Production: `require` (enforce SSL)
- Maximum security: `verify-full` (verify server certificate)

**Configuration:**
```env
# .env
DB_SSL_MODE=require  # For production
ENVIRONMENT=production
```

## Database Security

### Connection Security

**SSL/TLS Configuration:**
```go
// Location: services/auth/pkg/tenant/manager.go
// Automatic SSL mode selection based on environment:
// - production: require (enforce SSL)
// - development: prefer (use SSL if available)
// - test: disable (local testing only)
```

**Connection String:**
```
postgres://user:password@host:port/db?sslmode=require
```

### SQL Injection Prevention

**Always use parameterized queries:**

✅ **Good:**
```go
db.QueryRow(ctx,
    "SELECT * FROM users WHERE email = $1",
    email,
)
```

❌ **Bad:**
```go
query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)
db.QueryRow(ctx, query)
```

### Database Access Control

1. **Principle of Least Privilege:**
   - Application user: SELECT, INSERT, UPDATE, DELETE only
   - No DROP, TRUNCATE, or ALTER permissions
   - No access to system tables

2. **Network Isolation:**
   - Database not exposed to public internet
   - Only accessible from application network
   - Use firewall rules or security groups

3. **Audit Logging:**
   - Enable PostgreSQL logging
   - Log all DDL operations
   - Log failed authentication attempts

## Network Security

### CORS (Cross-Origin Resource Sharing)

**Implementation:** services/auth/main.go (lines 254-288)

**Security Features:**
- ✅ Explicit origin checking (no wildcards)
- ✅ Normalized origin comparison (trailing slash handling)
- ✅ Rejects unknown origins with 403 Forbidden
- ✅ Never uses `Access-Control-Allow-Origin: *` with credentials
- ✅ Production mode requires explicit CORS configuration

**Configuration:**
```env
# Development
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:3001

# Production - MUST be explicit, HTTPS only
CORS_ALLOW_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com
```

⚠️ **CRITICAL**: In production, service will reject requests if `CORS_ALLOW_ORIGINS` is not set.

### Rate Limiting

**API Gateway Level:**
- 100 requests per 15 minutes per IP address
- Applies to all public endpoints
- Returns 429 Too Many Requests when exceeded

**Location:** backend/api-gateway/index.js

**Bypass for Internal Services:**
- Service-to-service communication bypasses rate limiting
- Use internal network or service mesh

### API Security

1. **Authentication Required:**
   - All endpoints except `/login`, `/register`, `/health` require JWT
   - Token validated on every request
   - Expired tokens rejected (401 Unauthorized)

2. **Input Validation:**
   - Request body validation using struct tags
   - go-playground/validator for validation rules
   - Reject malformed requests (400 Bad Request)

3. **Output Sanitization:**
   - Never expose internal errors to clients
   - Log detailed errors server-side
   - Return generic error messages

## Deployment Security

### Environment Variables

**Never commit secrets to git:**

```bash
# Verify .env is gitignored
git check-ignore .env
# Should output: .env
```

**For Production:**

1. **Kubernetes Secrets:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: school-erp-secrets
type: Opaque
stringData:
  JWT_SECRET: <base64-encoded-secret>
  ENCRYPTION_KEY: <hex-encoded-key>
  DB_PASSWORD: <password>
```

2. **AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name school-erp/encryption-key \
  --secret-string "$(openssl rand -hex 32)"
```

3. **HashiCorp Vault:**
```bash
vault kv put secret/school-erp \
  encryption_key="$(openssl rand -hex 32)" \
  jwt_secret="$(openssl rand -base64 64)"
```

### Docker Security

1. **Non-root User:**
   - All services run as non-root in containers
   - Alpine-based images for minimal attack surface

2. **Image Scanning:**
```bash
# Scan for vulnerabilities
docker scan school-erp-auth:latest
```

3. **Secrets Management:**
   - Never bake secrets into images
   - Use Docker secrets or environment variables
   - Rotate secrets regularly

### Kubernetes Security

1. **Network Policies:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: auth-service-policy
spec:
  podSelector:
    matchLabels:
      app: auth-service
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
```

2. **RBAC:**
   - Restrict service account permissions
   - Limit pod access to Kubernetes API

3. **Pod Security Standards:**
   - Enable restricted pod security policy
   - Disable privilege escalation
   - Drop all capabilities

## Security Fixes Implemented

### Version 1.0.0-beta (December 2025)

#### 1. ✅ Fixed: Default Encryption Key Fallback
**Issue:** Auth service allowed default encryption key in production

**Fix:** Changed to `getRequiredEnv("ENCRYPTION_KEY")`
- **Location:** `services/auth/config/config.go:55`
- **Impact:** Service will panic if ENCRYPTION_KEY not set
- **Migration:** Set ENCRYPTION_KEY before deploying

#### 2. ✅ Fixed: Weak Key Derivation
**Issue:** Encryption keys were zero-padded instead of properly derived

**Fix:** Implemented PBKDF2-HMAC-SHA256
- **Location:** `services/auth/pkg/tenant/crypto.go:20-38`
- **Algorithm:** PBKDF2 with 100,000 iterations
- **Impact:** Stronger encryption key derivation
- **Migration:** Existing encrypted data remains compatible

#### 3. ✅ Fixed: Database SSL Disabled
**Issue:** All database connections used `sslmode=disable`

**Fix:** Environment-aware SSL mode
- **Location:** `services/auth/pkg/tenant/manager.go:68-92`
- **Modes:**
  - Production: `require` (enforces SSL)
  - Development: `prefer` (uses SSL if available)
  - Test: `disable` (local testing only)
- **Configuration:** Set `DB_SSL_MODE` in environment
- **Migration:** Ensure PostgreSQL server has SSL enabled

#### 4. ✅ Fixed: CORS Validation Weakness
**Issue:** Simple string matching could allow subdomain bypasses

**Fix:** Improved origin validation
- **Location:** `services/auth/main.go:29-49, 254-288`
- **Improvements:**
  - Normalized origin comparison
  - Trailing slash handling
  - Explicit rejection of unknown origins
  - Production mode validation
- **Impact:** Stricter CORS enforcement

#### 5. ✅ Fixed: Insecure Default Configuration
**Issue:** .env.example had weak defaults and minimal documentation

**Fix:** Enhanced security documentation
- **Location:** `.env.example`
- **Improvements:**
  - Added ENVIRONMENT variable
  - Added DB_SSL_MODE configuration
  - Comprehensive security notes
  - Secret generation commands
  - Rotation guidelines

## Security Checklist

### Pre-Production Deployment

- [ ] **Environment Configuration**
  - [ ] Set `ENVIRONMENT=production`
  - [ ] Set `DB_SSL_MODE=require`

- [ ] **Secrets Management**
  - [ ] Generate new JWT_SECRET: `openssl rand -base64 64`
  - [ ] Generate new REFRESH_TOKEN_SECRET: `openssl rand -base64 64`
  - [ ] Generate new ENCRYPTION_KEY: `openssl rand -hex 32`
  - [ ] Change SUPER_ADMIN_PASSWORD (12+ chars, complex)
  - [ ] Change database passwords
  - [ ] Store secrets in secrets manager (not .env file)

- [ ] **Database Security**
  - [ ] Enable SSL/TLS on PostgreSQL server
  - [ ] Configure database firewall rules
  - [ ] Create application user with minimal permissions
  - [ ] Enable audit logging

- [ ] **Network Security**
  - [ ] Configure CORS_ALLOW_ORIGINS with production domains (HTTPS only)
  - [ ] Enable HTTPS/TLS for all HTTP traffic
  - [ ] Configure reverse proxy with security headers
  - [ ] Set up WAF or DDoS protection

- [ ] **Application Security**
  - [ ] Review and update rate limiting rules
  - [ ] Enable logging and monitoring
  - [ ] Set up alerting for security events
  - [ ] Configure backup and disaster recovery

- [ ] **Code Security**
  - [ ] Run security scan: `docker scan` or Snyk
  - [ ] Update all dependencies to latest stable versions
  - [ ] Review OWASP Top 10 compliance
  - [ ] Conduct penetration testing

- [ ] **Compliance**
  - [ ] Document data processing (GDPR, FERPA compliance)
  - [ ] Implement data retention policies
  - [ ] Set up audit logging
  - [ ] Create incident response plan

### Regular Security Maintenance

**Monthly:**
- [ ] Review access logs for anomalies
- [ ] Check for dependency vulnerabilities
- [ ] Review active sessions and tokens

**Quarterly:**
- [ ] Rotate JWT secrets (requires user re-authentication)
- [ ] Rotate database passwords
- [ ] Review and update CORS allowed origins
- [ ] Conduct security audit

**Annually:**
- [ ] Penetration testing
- [ ] Security architecture review
- [ ] Compliance audit
- [ ] Disaster recovery drill

## Security Best Practices

### For Developers

1. **Never log sensitive data:**
   - Passwords, tokens, encryption keys
   - Personal information (PII)
   - Credit card numbers

2. **Always validate input:**
   - Use validator tags on structs
   - Validate file uploads (type, size, content)
   - Sanitize user-provided data

3. **Use parameterized queries:**
   - Never string concatenation for SQL
   - Use `$1, $2, ...` placeholders

4. **Handle errors securely:**
   - Log detailed errors server-side
   - Return generic errors to clients
   - Never expose stack traces

5. **Keep dependencies updated:**
```bash
# Check for vulnerabilities
go list -m all | nancy sleuth
npm audit
```

### For Operators

1. **Principle of Least Privilege:**
   - Give minimal required permissions
   - Separate dev/staging/prod environments
   - Use different credentials per environment

2. **Defense in Depth:**
   - Multiple layers of security
   - Assume any layer can be breached
   - Monitor and alert at each layer

3. **Regular Backups:**
   - Automated daily backups
   - Test restoration regularly
   - Encrypt backups at rest
   - Store offsite

4. **Monitoring and Alerting:**
   - Failed login attempts
   - Unusual API usage patterns
   - Database connection failures
   - Certificate expiration

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Contact

For security concerns, contact:
- Email: security@lamaerp.com
- GitHub: Create a private security advisory

---

**Last Updated:** December 2025
**Version:** 1.0.0-beta
