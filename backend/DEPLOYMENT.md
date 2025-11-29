# School ERP - Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Database Setup](#database-setup)
5. [API Documentation](#api-documentation)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites
- Node.js 18.x or higher
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- RabbitMQ 3.12

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/sujanale404/my\ projects/school-erp/backend
   ```

2. **Install dependencies for all services**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy .env file and update values
   cp .env .env.local

   # Update credentials
   DB_PASSWORD=your_secure_password
   JWT_SECRET=your_jwt_secret_key
   RABBITMQ_PASSWORD=your_rabbitmq_password
   ```

4. **Start services using Docker Compose**
   ```bash
   docker-compose -f docker/docker-compose.yml up --build
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Access the application**
   - API Gateway: http://localhost:3000
   - RabbitMQ Management: http://localhost:15672
   - Swagger API Docs: http://localhost:3000/api-docs

---

## Docker Deployment

### Build All Services

```bash
# Build API Gateway
docker build -t school-erp/api-gateway:latest ./api-gateway

# Build individual services
docker build -t school-erp/auth-service:latest ./services/auth
docker build -t school-erp/school-service:latest ./services/school
docker build -t school-erp/students-service:latest ./services/students
docker build -t school-erp/teachers-service:latest ./services/teachers
docker build -t school-erp/guardians-service:latest ./services/guardians
docker build -t school-erp/attendance-service:latest ./services/attendance
docker build -t school-erp/classes-service:latest ./services/classes
docker build -t school-erp/finance-service:latest ./services/finance
docker build -t school-erp/notifications-service:latest ./services/notifications
docker build -t school-erp/reports-service:latest ./services/reports
```

### Docker Compose Commands

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Stop all services
docker-compose -f docker/docker-compose.yml down

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# View logs for specific service
docker-compose -f docker/docker-compose.yml logs -f api-gateway

# Scale a service
docker-compose -f docker/docker-compose.yml up -d --scale students-service=3
```

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (v1.20+)
- kubectl configured
- Container registry credentials (Docker Hub, ECR, etc.)

### Deploy to Kubernetes

1. **Create namespace**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Create secrets**
   ```bash
   kubectl apply -f k8s/secrets.yaml -n school-erp

   # Or create manually
   kubectl create secret generic jwt-secret \
     --from-literal=secret='your-jwt-secret' \
     -n school-erp

   kubectl create secret generic postgres-secret \
     --from-literal=username=postgres \
     --from-literal=password='your-db-password' \
     -n school-erp
   ```

3. **Create ConfigMap**
   ```bash
   kubectl apply -f k8s/configmap.yaml -n school-erp
   ```

4. **Deploy infrastructure services**
   ```bash
   kubectl apply -f k8s/postgres-deployment.yaml -n school-erp
   kubectl apply -f k8s/redis-deployment.yaml -n school-erp
   ```

5. **Deploy application services**
   ```bash
   kubectl apply -f k8s/api-gateway-deployment.yaml -n school-erp
   kubectl apply -f k8s/auth-service-deployment.yaml -n school-erp
   # Apply other service deployments similarly
   ```

6. **Check deployment status**
   ```bash
   kubectl get deployments -n school-erp
   kubectl get pods -n school-erp
   kubectl get svc -n school-erp
   ```

7. **Access the API Gateway**
   ```bash
   # Get external IP (might take a minute)
   kubectl get svc api-gateway-service -n school-erp

   # Access via the LoadBalancer IP or port-forward
   kubectl port-forward svc/api-gateway-service 3000:80 -n school-erp
   ```

### Scale Services

```bash
# Scale auth service to 3 replicas
kubectl scale deployment auth-service --replicas=3 -n school-erp

# Auto-scale based on CPU
kubectl autoscale deployment auth-service --min=2 --max=5 \
  --cpu-percent=80 -n school-erp
```

### Monitor Kubernetes

```bash
# Watch pod status
kubectl get pods -n school-erp -w

# View logs
kubectl logs deployment/api-gateway -n school-erp -f

# Describe pod for issues
kubectl describe pod <pod-name> -n school-erp

# Access pod shell
kubectl exec -it <pod-name> -n school-erp -- /bin/sh
```

---

## Database Setup

### Run Migrations

```bash
# Run all pending migrations
npm run migrate

# Or manually connect to database
psql -h localhost -U postgres -d school_erp -f migrations/init.sql
```

### Database Backup

```bash
# Backup database
pg_dump -h localhost -U postgres school_erp > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h localhost -U postgres school_erp < backup_20240101.sql
```

### Verify Database Setup

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d school_erp

# List tables
\dt

# Verify indexes
\di

# Check user permissions
\du
```

---

## API Documentation

### Swagger/OpenAPI Access

1. **Via Browser**
   - Start the application
   - Navigate to: http://localhost:3000/api-docs
   - Or use external Swagger UI: https://swagger.io/tools/swagger-ui/

2. **Import Swagger JSON**
   - Load `api-docs/swagger.json` into Swagger UI
   - Full API documentation with all endpoints

### API Endpoints Summary

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify` - Verify token
- `POST /api/v1/auth/refresh` - Refresh token

#### Students
- `POST /api/v1/students` - Create student
- `GET /api/v1/students` - List students
- `GET /api/v1/students/:id` - Get student details
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student

#### Teachers
- `POST /api/v1/teachers` - Create teacher
- `GET /api/v1/teachers` - List teachers
- `GET /api/v1/teachers/:id` - Get teacher details
- `PUT /api/v1/teachers/:id` - Update teacher
- `DELETE /api/v1/teachers/:id` - Delete teacher

#### Similar endpoints available for:
- Schools (`/api/v1/schools`)
- Guardians (`/api/v1/guardians`)
- Attendance (`/api/v1/attendance`)
- Classes (`/api/v1/classes`)
- Finance/Fees (`/api/v1/fees`)
- Notifications (`/api/v1/notifications`)
- Reports (`/api/v1/reports`)

---

## Monitoring and Logging

### Health Checks

All services expose a `/health` endpoint:

```bash
# Check API Gateway health
curl http://localhost:3000/health

# Check Auth Service health
curl http://localhost:3001/health

# Health check for all services
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq .
done
```

### RabbitMQ Monitoring

```bash
# Access RabbitMQ Management UI
# URL: http://localhost:15672
# Default credentials: guest/guest

# View queues
rabbitmqctl list_queues

# View exchanges
rabbitmqctl list_exchanges

# View bindings
rabbitmqctl list_bindings

# Monitor connections
rabbitmqctl list_connections
```

### View Logs

```bash
# Docker Compose logs
docker-compose -f docker/docker-compose.yml logs -f

# Specific service logs
docker-compose -f docker/docker-compose.yml logs -f auth-service

# Kubernetes logs
kubectl logs -f deployment/auth-service -n school-erp
```

---

## Troubleshooting

### Service Won't Start

1. **Check port availability**
   ```bash
   lsof -i :3000  # Check if port 3000 is in use
   ```

2. **Check database connection**
   ```bash
   psql -h localhost -U postgres -d school_erp -c "SELECT 1"
   ```

3. **View service logs**
   ```bash
   docker-compose -f docker/docker-compose.yml logs auth-service
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running**
   ```bash
   docker-compose -f docker/docker-compose.yml ps postgres
   ```

2. **Check database credentials in .env**
   ```bash
   cat .env | grep DB_
   ```

3. **Test connection directly**
   ```bash
   psql -h localhost -U postgres -d school_erp
   ```

### RabbitMQ Connection Issues

1. **Check RabbitMQ is running**
   ```bash
   docker-compose -f docker/docker-compose.yml ps rabbitmq
   ```

2. **Verify RabbitMQ Management UI**
   ```bash
   curl http://localhost:15672/api/overview
   ```

3. **Check credentials**
   ```bash
   cat .env | grep RABBITMQ_
   ```

### API Gateway Not Routing

1. **Check health of backend services**
   ```bash
   curl http://localhost:3001/health  # Auth service
   curl http://localhost:3003/health  # Students service
   ```

2. **Verify JWT token in requests**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/v1/students
   ```

3. **Check API Gateway logs**
   ```bash
   docker-compose -f docker/docker-compose.yml logs api-gateway
   ```

### Performance Issues

1. **Check resource usage**
   ```bash
   docker stats
   kubectl top nodes -n school-erp
   kubectl top pods -n school-erp
   ```

2. **Monitor database**
   ```bash
   psql -h localhost -U postgres -d school_erp
   SELECT * FROM pg_stat_statements LIMIT 10;
   ```

3. **Scale services**
   ```bash
   docker-compose -f docker/docker-compose.yml up -d --scale students-service=3
   ```

---

## Production Checklist

- [ ] Update all default passwords in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Configure monitoring and alerting
- [ ] Set up CI/CD pipeline
- [ ] Test disaster recovery
- [ ] Enable logging to external service
- [ ] Configure rate limiting
- [ ] Set up authentication providers
- [ ] Test load balancing
- [ ] Configure auto-scaling policies
- [ ] Set up log rotation
- [ ] Configure metrics collection

---

## Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review API docs: http://localhost:3000/api-docs
- Check health endpoints: `curl http://localhost:3000/health`
- Verify database: `psql -d school_erp`

---

**Last Updated:** 2024
**Version:** 1.0.0
