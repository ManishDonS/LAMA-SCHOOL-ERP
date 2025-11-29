# School ERP - Setup & Deployment Guide

This guide explains how to properly set up and deploy the School ERP system with production-ready configuration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Setup](#production-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Running Services](#running-services)
7. [Security Checklist](#security-checklist)

---


## Prerequisites

- Node.js 14+ and npm
- PostgreSQL 12+
- Redis (optional, for caching)
- RabbitMQ (optional, for async messaging)

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd school-erp
```

### 2. Create Environment Configuration

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Update Development Credentials

Edit `backend/.env`:

```env
# Use development defaults
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_erp
DB_USER=postgres
DB_PASSWORD=postgres_dev_password

JWT_SECRET=dev-secret-key-for-testing-only

NODE_ENV=development
DOCKER=false
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
cd ..
```

### 5. Create Database

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE school_erp;"
```

### 6. Run Database Migrations

```bash
cd backend
node migrations/run.js
cd ..
```

### 7. Start Services

In separate terminal windows:

```bash
# Terminal 1: API Gateway
cd backend/api-gateway
node index.js

# Terminal 2: Auth Service
cd backend/services/auth
node index.js

# Terminal 3: School Service
cd backend/services/school
node index.js

# Terminal 4: Frontend
cd frontend
npm run dev
```

Access the application at: `http://localhost:3000`

---

## Production Setup

### 1. Generate Strong Secrets

```bash
# Generate JWT Secret (32+ character random string)
openssl rand -base64 32

# Generate Database Password
openssl rand -base64 16

# Generate RabbitMQ Password
openssl rand -base64 16
```

### 2. Create Production Environment File

```bash
cp backend/.env.example backend/.env.production
```

Edit `backend/.env.production`:

```env
# Database (use strong credentials)
DB_HOST=your-db-host.example.com
DB_PORT=5432
DB_NAME=school_erp_prod
DB_USER=school_erp_user
DB_PASSWORD=<GENERATED_STRONG_PASSWORD>

# Redis
REDIS_HOST=your-redis-host.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<GENERATED_PASSWORD>

# RabbitMQ
RABBITMQ_HOST=your-rabbitmq-host.example.com
RABBITMQ_USER=school_erp
RABBITMQ_PASSWORD=<GENERATED_PASSWORD>

# JWT - CRITICAL: Use generated random value
JWT_SECRET=<GENERATED_JWT_SECRET>
JWT_EXPIRY=24h

# Environment
NODE_ENV=production
LOG_LEVEL=info

# Gateway
GATEWAY_PORT=8080

# Service Ports (use internal network)
AUTH_SERVICE_PORT=3001
SCHOOL_SERVICE_PORT=3011
# ... other services

DOCKER=true
```

### 3. Deploy with Docker Compose

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Database Initialization

```bash
# Run migrations in production database
docker-compose exec api-gateway node /app/migrations/run.js
```

---

## Environment Variables

### Required (No Fallbacks)

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing key (32+ chars, random) | `openssl rand -base64 32` |
| `DB_PASSWORD` | PostgreSQL password | Strong password |
| `NODE_ENV` | Environment (development/staging/production) | production |

### Recommended for Production

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | school_erp |
| `DB_USER` | PostgreSQL user | postgres |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `RABBITMQ_HOST` | RabbitMQ host | localhost |
| `RABBITMQ_USER` | RabbitMQ user | guest |
| `RABBITMQ_PASSWORD` | RabbitMQ password | Change in production |
| `GATEWAY_PORT` | API Gateway port | 8080 |
| `LOG_LEVEL` | Logging level | info |

### Service Ports

All service ports should be configured to avoid conflicts:

```env
AUTH_SERVICE_PORT=3001
SCHOOL_SERVICE_PORT=3011
STUDENTS_SERVICE_PORT=3003
TEACHERS_SERVICE_PORT=3002
GUARDIANS_SERVICE_PORT=3005
ATTENDANCE_SERVICE_PORT=3004
CLASSES_SERVICE_PORT=3008
FINANCE_SERVICE_PORT=3005
NOTIFICATIONS_SERVICE_PORT=3007
REPORTS_SERVICE_PORT=3010
```

---

## Database Setup

### Local PostgreSQL

```bash
# Install PostgreSQL
# macOS:
brew install postgresql

# Ubuntu:
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Create database
psql -U postgres -c "CREATE DATABASE school_erp;"

# Run migrations
cd backend
node migrations/run.js
```

### Production Database

Use managed services (AWS RDS, Google Cloud SQL, DigitalOcean Managed Databases) for better security and reliability.

---

## Running Services

### Development (Local)

```bash
# Terminal 1: API Gateway
cd backend/api-gateway && GATEWAY_PORT=8080 NODE_ENV=development node index.js

# Terminal 2: Auth Service
cd backend/services/auth && NODE_ENV=development node index.js

# Terminal 3: School Service
cd backend/services/school && NODE_ENV=development node index.js

# Terminal 4: Frontend
cd frontend && PORT=3000 npm run dev
```

### Production (Docker Compose)

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production (Kubernetes)

Refer to `k8s/` directory for Kubernetes deployment manifests.

---

## Security Checklist

Before deploying to production:

- [ ] **JWT_SECRET**: Generated using `openssl rand -base64 32` (NOT default value)
- [ ] **DB_PASSWORD**: Strong password (minimum 16 characters, mixed case, numbers, symbols)
- [ ] **RABBITMQ_PASSWORD**: Changed from default "guest"
- [ ] **Environment**: `NODE_ENV=production`
- [ ] **Logging**: `LOG_LEVEL=info` (not debug)
- [ ] **.env File**: Never committed to version control
- [ ] **SSL/TLS**: Configured on API Gateway
- [ ] **HTTPS**: Enforced on all endpoints
- [ ] **Database**: Using managed service or proper backup strategy
- [ ] **Firewall**: Restrict database access to application servers only
- [ ] **Monitoring**: Set up logging and monitoring
- [ ] **Backups**: Automated daily backups enabled
- [ ] **Secrets**: Use environment variables, never hardcoded values

---

## Troubleshooting

### Services Won't Start

1. Check environment variables are set: `echo $JWT_SECRET`
2. Verify database is running: `psql -U postgres -l`
3. Check port conflicts: `lsof -i :3000` (or desired port)
4. Review service logs for errors

### Database Connection Failed

1. Verify PostgreSQL is running
2. Check credentials in .env match database
3. Ensure database exists: `psql -U postgres -l | grep school_erp`
4. Test connection: `psql -U postgres -h localhost -d school_erp`

### Port Already in Use

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port
GATEWAY_PORT=9000 node index.js
```

---

## Quick Reference Commands

```bash
# Generate random secrets
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 16   # Database password

# Check if PostgreSQL is running
psql --version

# List databases
psql -U postgres -l

# Create database
psql -U postgres -c "CREATE DATABASE school_erp;"

# Drop database
psql -U postgres -c "DROP DATABASE school_erp;"

# Check port usage
lsof -i :8080

# View .env file (safely)
cat backend/.env | grep -v PASSWORD

# Test API Gateway
curl http://localhost:8080/health
```

---

## Support

For issues or questions:
1. Check this guide
2. Review service logs
3. Check `.env` configuration
4. Contact the development team

---

**Last Updated**: 2025-11-11
**Version**: 1.0
