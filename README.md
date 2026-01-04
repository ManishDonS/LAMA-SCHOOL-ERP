# LAMA School ERP (Enterprise Resource Planning) System

LAMA — Learning & Academic Management Application is a comprehensive, scalable, microservices-based Enterprise Resource Planning (ERP) system for schools. It efficiently manages students, attendance, fees, exams, notifications, and real-time features, leveraging modern cloud-native technologies for performance, scalability, and reliability.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Modules
- **Authentication & Authorization**: Multi-tenant JWT-based authentication with role-based access control (RBAC)
- **School Management**: Multi-school support with isolated databases per tenant
- **User Management**: Comprehensive user management with role assignments
- **Student Management**: Complete student lifecycle management and records
- **Attendance Tracking**: Real-time attendance recording and analytics
- **Fee Management**: Fee structure, billing, and payment tracking
- **Exam Management**: Exam scheduling, grade management, and result processing

### Additional Modules
- **Payroll Management**: Employee salary calculation and payroll processing
- **Expense Management**: School expense tracking and budget management
- **Accounting**: Double-entry bookkeeping and financial reporting
- **Transport Management**: Vehicle tracking with Traccar GPS integration
- **Communication**: Internal messaging and communication system
- **Notifications**: Real-time push notifications to students and parents
- **Website Builder**: AI-powered school website generation (OpenAI/Gemini integration)
- **Real-time Updates**: WebSocket-based real-time communication across all modules

### Technical Features
- **Multi-tenancy**: Database isolation per school for data security
- **RESTful APIs**: Well-documented REST APIs for all services
- **Microservices Architecture**: Independent, scalable services
- **Event-Driven**: NATS-based event streaming between services
- **Caching**: Redis caching for improved performance
- **Reporting & Analytics**: Comprehensive reports and dashboards

## Architecture

The system is built using a microservices architecture with the following components:

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend (Next.js + TypeScript)                 │
│                    http://localhost:3000                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │    Nginx Gateway     │
                │    (Port 8081)       │
                └──────────┬───────────┘
                           │
        ┏━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━┓
        ┃        Go Microservices              ┃
        ┗━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┛
                           │
   ┌───────────────────────┼───────────────────────┐
   │                       │                       │
┌──▼──────┐         ┌─────▼──────┐         ┌─────▼──────┐
│  Auth   │         │   School   │         │    User    │
│  :3001  │         │   :3011    │         │   :3002    │
└─────────┘         └────────────┘         └────────────┘
   │                       │                       │
   ├───────────────────────┼───────────────────────┤
   │                       │                       │
┌──▼──────┐         ┌─────▼──────┐         ┌─────▼──────┐
│ Student │         │ Attendance │         │    Fee     │
│  :3003  │         │   :3004    │         │   :3005    │
└─────────┘         └────────────┘         └────────────┘
   │                       │                       │
   ├───────────────────────┼───────────────────────┤
   │                       │                       │
┌──▼──────┐         ┌─────▼──────┐         ┌─────▼──────┐
│  Exam   │         │   Notif    │         │  Realtime  │
│  :3006  │         │   :3007    │         │   :3008    │
└─────────┘         └────────────┘         └────────────┘
   │                       │                       │
   ├───────────────────────┼───────────────────────┤
   │                       │                       │
┌──▼──────┐         ┌─────▼──────┐         ┌─────▼──────┐
│Transport│         │  Expense   │         │  Payroll   │
│  :3009  │         │   :3010    │         │   :3012    │
└─────────┘         └────────────┘         └────────────┘
   │                       │                       │
   ├───────────────────────┼───────────────────────┤
   │                       │                       │
┌──▼──────┐         ┌─────▼──────┐         ┌─────▼──────┐
│ Website │         │ Accounting │         │   Comms    │
│  :3013  │         │   :8009    │         │   :8005    │
└─────────┘         └────────────┘         └────────────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
        ┌───▼────┐      ┌───▼────┐    ┌───▼──────┐
        │PostgreSQL     │ Redis  │    │  NATS    │
        │ :5435         │ :6380  │    │  :4223   │
        │(Multi-tenant) │ Cache  │    │  Queue   │
        └───────────┘   └────────┘    └──────────┘
```

### Multi-Tenancy Architecture
Each school has its own isolated PostgreSQL database with encrypted credentials stored in the main database. The system uses tenant resolution via:
- Header: `X-Tenant-Code`
- Subdomain: `{school-code}.domain.com`
- Query Parameter: `?tenant={school-code}`

## Tech Stack

### Backend
- **Language**: Go 1.20+
- **Framework**: Fiber v2 (Fast HTTP framework)
- **Database**: PostgreSQL 16 with pgx driver
- **Cache**: Redis 7
- **Message Queue**: NATS 2.10 with JetStream
- **API Gateway**: Nginx 1.25+ (Reverse Proxy & CORS Authority)
- **Authentication**: JWT (golang-jwt/jwt v5)
- **Password Hashing**: bcrypt (cost factor: 12)
- **Encryption**: AES-256-GCM
- **Logging**: zerolog (structured logging)
- **Container**: Docker & Docker Compose
- **Orchestration**: Kubernetes with Helm 3
- **CI/CD**: GitHub Actions ready

### Frontend
- **Framework**: Next.js 14.2.35 (React 18.2.0)
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.3.6
- **State Management**: Zustand 4.4.2 with persistence
- **HTTP Client**: Axios 1.13.2
- **Form Handling**: react-hook-form 7.48.0
- **Validation**: Zod 3.22.4
- **Charts**: react-chartjs-2
- **Icons**: Lucide React
- **Notifications**: react-hot-toast 2.4.1
- **Real-time**: WebSocket support

### Infrastructure
- **Database**: PostgreSQL with multi-tenant isolation
- **Caching**: Redis for session and data caching
- **Event Bus**: NATS for inter-service communication
- **File Storage**: Local volume mounts (S3-ready architecture)
- **Monitoring**: Health check endpoints on all services
- **Security**:
  - Rate limiting (100 requests/15min per IP)
  - CORS configuration
  - HttpOnly cookies for refresh tokens
  - AES-256-GCM encryption for sensitive data

## Security Considerations

### Critical: Before Production Deployment

**WARNING**: The following security issues must be addressed before production:

1. **SSL/TLS for Database Connections** - Currently disabled (`sslmode=disable`)
   - Change to `sslmode=require` in all service database connections
   - Location: `services/*/config/config.go` and `services/*/database/database.go`

2. **Encryption Key Management**
   - Remove default fallback key in `services/auth/config/config.go:55`
   - Generate strong encryption key: `openssl rand -hex 32`
   - Set `ENCRYPTION_KEY` environment variable (required)

3. **Credential Management**
   - Rotate default super admin password (currently: `Admin@1234`)
   - Never commit `.env` file to version control
   - Use secrets management (Kubernetes secrets, HashiCorp Vault, etc.)

4. **JWT Secrets**
   - Generate strong secrets: `openssl rand -base64 64`
   - Change both `JWT_SECRET` and `REFRESH_TOKEN_SECRET`

5. **Key Derivation**
   - ✅ **Implemented**: PBKDF2 with 100,000 iterations is now used for all tenant password encryption.
   - Location: `services/*/pkg/tenant/crypto.go`

See [SECURITY.md](./SECURITY.md) for complete security guidelines.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Go** 1.20 or higher (for building services)
- **Node.js** v18.x or higher (for frontend and API gateway)
- **Docker** & Docker Compose
- **PostgreSQL** 16+ (or use Docker)
- **Redis** 7+ (or use Docker)
- **NATS** 2.10+ (or use Docker)
- **Make** (optional, for automation)
- **kubectl** (for Kubernetes deployment)
- **Helm** 3.x (for Kubernetes deployment)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd school-erp
```

### 2. Set Up Environment Variables

Copy the `.env.example` file and create your own `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables (see `.env.example` for all options):

**Minimum Required Configuration:**

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=school_erp
DB_USER=postgres
DB_PASSWORD=your-secure-password-here

# Redis
REDIS_HOST=redis
REDIS_PORT=6380

# NATS
NATS_URL=nats://nats:4222

# JWT Secrets (REQUIRED - generate with: openssl rand -base64 64)
JWT_SECRET=your-super-secret-jwt-key-change-this
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key

# Encryption (REQUIRED - generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# Super Admin
SUPER_ADMIN_EMAIL=admin@yourschool.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!

# Optional: AI Integration for Website Builder
OPENAI_API_KEY=your-openai-key (optional)
GEMINI_API_KEY=your-gemini-key (optional)

# Optional: Transport Service (Traccar GPS)
TRACCAR_API_URL=https://your-traccar-server.com/api
TRACCAR_USER=admin
TRACCAR_PASSWORD=your-traccar-password
```

### 3. Start Services with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

This will start:
- **PostgreSQL Database** (port 5435)
- **Redis Cache** (port 6380)
- **NATS Message Queue** (port 4223)
- **15 Go Microservices**:
  - Auth Service (3001)
  - User Service (3002)
  - Student Service (3003)
  - Attendance Service (3004)
  - Fee Service (3005)
  - Exam Service (3006)
  - Notification Service (3007)
  - Realtime Service (3008)
  - Transport Service (3009)
  - Expense Service (3010)
  - School Service (3011)
  - Payroll Service (3012)
  - Website Service (3013)
  - Communication Service (8005)
  - Accounting Service (8009)

### 4. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install service dependencies (automatically done by Docker)
```

### 5. Run Database Migrations

```bash
make migrate
```

## Development

### Local Development Setup

```bash
# Start all services
make up

# Run tests
make test

# Run linting
make lint

# Format code
make format

# View logs
make logs

# Stop all services
make down
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the frontend.

## API Documentation

### Interactive Swagger UI

Each microservice exposes interactive API documentation via Swagger UI. Access the documentation for any service at:

```
http://localhost:{port}/swagger/
```

**Quick Access**:
- **Auth Service**: http://localhost:3001/swagger/ ✅ Fully Documented
- **School Service**: http://localhost:3011/swagger/
- **Student Service**: http://localhost:3003/swagger/
- All other services: http://localhost:{port}/swagger/

**API Documentation Portal**: Open [`docs/api-portal.html`](docs/api-portal.html) in your browser for a complete list of all services with one-click access to their Swagger UIs.

### Comprehensive API Guide

See **[API.md](API.md)** for:
- Complete endpoint documentation
- Authentication flow and examples
- Multi-tenancy usage
- Rate limiting details
- cURL examples for all services
- Error handling reference

### Using Swagger UI

1. **Start services**: `docker-compose up -d`
2. **Get auth token**: Login via `/api/v1/auth/login`
3. **Authorize in Swagger**:
   - Click "Authorize" button
   - Enter: `Bearer {your-access-token}`
   - Test endpoints directly in browser

### API Endpoints

All endpoints require authentication (except auth/login and auth/register) via JWT token in the `Authorization: Bearer <token>` header. Multi-tenant endpoints also require `X-Tenant-Code` header.

#### Auth Service (Port 3001)
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - Register new school
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - User logout
- `GET /health` - Health check

#### School Service (Port 3011)
- `POST /api/v1/schools` - Create new school
- `GET /api/v1/schools` - List all schools
- `GET /api/v1/schools/:id` - Get school details
- `PUT /api/v1/schools/:id` - Update school
- `POST /api/v1/schools/:id/logo` - Upload school logo
- `GET /api/v1/schools/:id/stats` - Get school statistics

#### User Service (Port 3002)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user details
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `GET /api/v1/users/:id/permissions` - Get user permissions

#### Student Service (Port 3003)
- `GET /api/v1/students` - List all students
- `POST /api/v1/students` - Create new student
- `GET /api/v1/students/:id` - Get student details
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student
- `GET /api/v1/students/:id/academic-history` - Get academic records

#### Attendance Service (Port 3004)
- `GET /api/v1/attendance` - List attendance records
- `POST /api/v1/attendance` - Mark attendance
- `GET /api/v1/attendance/:id` - Get attendance details
- `GET /api/v1/attendance/student/:id` - Get student attendance
- `GET /api/v1/attendance/reports` - Generate attendance reports

#### Fee Service (Port 3005)
- `GET /api/v1/fees` - List fee records
- `POST /api/v1/fees` - Create fee record
- `PUT /api/v1/fees/:id` - Update fee record
- `DELETE /api/v1/fees/:id` - Delete fee record
- `POST /api/v1/fees/:id/payment` - Record payment
- `GET /api/v1/fees/student/:id` - Get student fee history

#### Exam Service (Port 3006)
- `GET /api/v1/exams` - List exams
- `POST /api/v1/exams` - Create exam
- `PUT /api/v1/exams/:id` - Update exam
- `DELETE /api/v1/exams/:id` - Delete exam
- `POST /api/v1/exams/:id/results` - Submit exam results
- `GET /api/v1/exams/:id/grades` - Get exam grades

#### Notification Service (Port 3007)
- `GET /api/v1/notifications` - List notifications
- `POST /api/v1/notifications` - Send notification
- `DELETE /api/v1/notifications/:id` - Delete notification
- `GET /api/v1/notifications/user/:id` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read

#### Realtime Service (Port 3008)
- WebSocket connections for real-time updates
- Live attendance updates
- Real-time notifications
- Event streaming via NATS

#### Transport Service (Port 3009)
- `GET /api/v1/transport/vehicles` - List vehicles
- `POST /api/v1/transport/vehicles` - Add vehicle
- `GET /api/v1/transport/vehicles/:id/location` - Get GPS location (Traccar integration)
- `GET /api/v1/transport/routes` - List routes
- `POST /api/v1/transport/routes` - Create route

#### Expense Service (Port 3010)
- `GET /api/v1/expenses` - List expenses
- `POST /api/v1/expenses` - Create expense
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense
- `GET /api/v1/expenses/categories` - List expense categories
- `POST /api/v1/expenses/:id/receipt` - Upload receipt

#### Payroll Service (Port 3012)
- `GET /api/v1/payroll/employees` - List employees
- `POST /api/v1/payroll/employees` - Add employee
- `GET /api/v1/payroll/salaries` - List salary records
- `POST /api/v1/payroll/process` - Process payroll
- `GET /api/v1/payroll/reports` - Generate payroll reports

#### Website Service (Port 3013)
- `GET /api/v1/website/pages` - List website pages
- `POST /api/v1/website/generate` - AI-powered website generation (OpenAI/Gemini)
- `PUT /api/v1/website/pages/:id` - Update page
- `POST /api/v1/website/publish` - Publish website

#### Accounting Service (Port 8009)
- `GET /api/v1/accounting/accounts` - List accounts
- `POST /api/v1/accounting/transactions` - Record transaction
- `GET /api/v1/accounting/balance-sheet` - Get balance sheet
- `GET /api/v1/accounting/income-statement` - Get income statement
- `GET /api/v1/accounting/trial-balance` - Get trial balance

#### Communication Service (Port 8005)
- `GET /api/v1/channels` - List communication channels
- `POST /api/v1/channels` - Create new channel
- `POST /api/v1/channels/:channelId/members` - Add member to channel
- `GET /api/v1/channels/:channelId/messages` - Get channel messages
- `POST /api/v1/channels/:channelId/messages` - Send message to channel
- `GET /api/v1/users` - List users for messaging

## Testing

The project includes comprehensive testing infrastructure with unit tests, integration tests, and benchmark tests.

### Running Tests

```bash
# Run all tests
make test

# Run tests for specific service
make test-service SERVICE=auth

# Run tests with verbose output
make test-verbose

# Run only short tests (skip long-running tests)
make test-short

# Run benchmark tests
make test-bench

# Generate coverage report
make coverage

# Generate and open HTML coverage report
make coverage-html
```

### Test Coverage

| Service | Unit Tests | Integration Tests | Coverage |
|---------|-----------|-------------------|----------|
| **Auth** | ✅ Complete | 🔄 Planned | ~80% |
| School | 🔄 Planned | 🔄 Planned | 0% |
| User | 🔄 Planned | 🔄 Planned | 0% |
| Student | 🔄 Planned | 🔄 Planned | 0% |
| Other Services | 🔄 Planned | 🔄 Planned | 0% |

**Auth Service Tests** (49+ unit tests, 11 benchmark tests):
- ✅ Password validation (11 test cases)
- ✅ Password hashing/verification (3 tests + 3 benchmarks)
- ✅ JWT token generation (8 test cases)
- ✅ JWT token verification (5 test cases)
- ✅ Encryption/decryption (15 test cases + 5 benchmarks)
- ✅ PBKDF2 key derivation (3 tests)
- ✅ Thread safety tests

### Test Documentation

See **[TESTING.md](TESTING.md)** for:
- Complete testing guide and best practices
- How to write tests (table-driven tests, mocking, benchmarks)
- Test structure and organization
- Continuous integration setup
- Troubleshooting common test issues

## Deployment

### Docker Deployment

```bash
# Build all services
docker-compose build

# Start in production mode
docker-compose -f docker-compose.yml up -d
```

### Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster running
- kubectl configured
- Helm 3.x installed

#### Deploy with Helm

```bash
# Add Helm repository
helm repo add school-erp ./infra/helm/charts

# Install the chart
helm install school-erp school-erp/school-erp \
  --namespace school-erp \
  --create-namespace \
  -f infra/helm/values.yaml

# Verify deployment
kubectl get pods -n school-erp
```

#### Upgrade Deployment

```bash
helm upgrade school-erp school-erp/school-erp \
  --namespace school-erp \
  -f infra/helm/values.yaml
```

#### View Helm Values

```bash
helm show values school-erp/school-erp
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:
- Builds Docker images
- Runs tests
- Pushes to Docker registry
- Deploys to Kubernetes (on main branch)

See `.github/workflows/` for configuration.

## Project Structure

```
LAMA-SCHOOL-ERP/
├── frontend/                      # Next.js frontend application
│   ├── src/
│   │   ├── app/                  # Next.js 14 App Router
│   │   ├── components/           # React components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   ├── students/        # Student management UI
│   │   │   └── ...              # Other feature components
│   │   ├── store/               # Zustand state management
│   │   │   ├── authStore.ts     # Auth state (tokens, user)
│   │   │   └── ...              # Other stores
│   │   ├── services/            # API service clients
│   │   │   └── api.ts           # Axios client with interceptors
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── services/                      # Go Microservices (15 services)
│   ├── auth/                     # Authentication & JWT (Port 3001)
│   │   ├── main.go
│   │   ├── config/              # Configuration
│   │   ├── handlers/            # HTTP handlers
│   │   ├── middleware/          # Auth middleware
│   │   ├── routes/              # Route definitions
│   │   ├── utils/               # JWT, password, crypto utils
│   │   ├── pkg/tenant/          # Multi-tenancy manager
│   │   └── Dockerfile
│   ├── school/                  # School management (Port 3011)
│   ├── user/                    # User management (Port 3002)
│   ├── student/                 # Student records (Port 3003)
│   ├── attendance/              # Attendance tracking (Port 3004)
│   ├── fee/                     # Fee management (Port 3005)
│   ├── exam/                    # Exam & grades (Port 3006)
│   ├── notification/            # Notifications (Port 3007)
│   ├── realtime/                # WebSocket service (Port 3008)
│   ├── transport/               # GPS tracking (Port 3009)
│   ├── expense/                 # Expense tracking (Port 3010)
│   ├── payroll/                 # Payroll processing (Port 3012)
│   ├── website/                 # AI website builder (Port 3013)
│   ├── communication/           # Internal messaging (Port 8005)
│   └── accounting/              # Accounting (Port 8009)
│
├── backend/
│   ├── api-gateway/             # Node.js Express API Gateway
│   │   ├── index.js            # Main gateway server
│   │   ├── routes/             # Route proxying
│   │   └── middleware/         # Rate limiting, CORS
│   ├── shared/                  # Shared utilities
│   └── migrations/              # Database migrations
│       └── sql/                # SQL migration files
│
├── infra/                       # Infrastructure as Code
│   ├── k8s/                    # Kubernetes manifests
│   │   ├── deployments/
│   │   ├── services/
│   │   └── ingress/
│   ├── helm/                   # Helm charts
│   │   └── charts/
│   └── nginx/                  # Nginx configuration
│
├── docs/                        # Documentation (if exists)
│   └── api/                    # API documentation
│
├── docker-compose.yml           # Docker Compose for local development
├── Makefile                     # Build automation scripts
├── .env.example                 # Environment variables template
├── .env                         # Environment variables (gitignored)
├── .gitignore
└── README.md                    # This file
```

### Service Structure (Standard for all Go services)

Each Go microservice follows this structure:

```
service-name/
├── main.go                      # Entry point
├── config/
│   └── config.go               # Configuration loading
├── database/
│   └── database.go             # Database connection
├── handlers/
│   └── *_handler.go            # HTTP request handlers
├── middleware/
│   └── auth.go                 # Authentication middleware
├── routes/
│   └── routes.go               # Route registration
├── models/
│   └── *.go                    # Data models
├── pkg/                        # Internal packages
├── utils/                      # Utility functions
├── Dockerfile                  # Container build file
└── go.mod                      # Go module dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use TypeScript for type safety
- Follow ESLint rules for frontend code
- Follow Go best practices for backend services
- Write unit tests for new features (see [TESTING.md](TESTING.md))
- Use table-driven tests for Go code
- Aim for 75%+ test coverage on critical paths
- Document APIs with clear comments
- Use semantic commit messages
- Ensure all tests pass before submitting PR
- Update documentation as needed

## Roadmap

### In Progress
- [ ] Add unit and integration tests to remaining services (Auth service: ✅ Complete)
- [ ] Add Swagger documentation to remaining services (Auth service: ✅ Complete)
- [ ] Improve logging consistency across all services

### Planned Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and BI dashboard
- [ ] Automated SMS/Email notifications
- [ ] Payment gateway integration (Stripe, PayPal, local gateways)
- [ ] Mobile biometric attendance
- [ ] Video conferencing for online classes
- [ ] Library management module
- [ ] Hostel management module
- [ ] Alumni management
- [ ] Multi-language support (i18n)
- [ ] Parent portal mobile app
- [ ] AI-powered student performance prediction
- [ ] Exam proctoring system

## Known Issues

1. **SSL/TLS**: Database connections currently use `sslmode=disable` (must fix for production)
2. **Large binaries**: Service binaries checked into git (should be removed)
3. **Logging inconsistency**: Some services use structured logging, others use basic logging
4. **Test coverage**: Auth service has comprehensive tests (~80% coverage), other services need tests

See [Issues](https://github.com/your-repo/issues) for full list.

## Recent Updates

- ✅ **Hardened CORS Implementation**: Centralized CORS authority in Nginx with dynamic origin validation.
- ✅ **Migration Stability**: Resilient schema migrations for Auth, Student, and User services (UUID/BigInt consistency).
- ✅ **Comprehensive Testing Infrastructure** (Auth service: 49+ unit tests, 11 benchmarks, ~80% coverage)
- ✅ **API Documentation Portal with Swagger UI** (interactive documentation for all services)
- ✅ **Security Hardening** (PBKDF2 key derivation implemented across services)
- ✅ Communication service integrated into docker-compose (15 services total)
- ✅ Multi-tenant architecture with database isolation
- ✅ JWT-based authentication with refresh tokens
- ✅ Transport service with Traccar GPS integration
- ✅ Website builder with AI integration (OpenAI/Gemini)
- ✅ Payroll and accounting modules
- ✅ Expense management with receipt uploads
- ✅ Fixed double-encryption bug in school admin handlers
- ✅ Resolved module activation persistence issues

## Authors

- **Manish Lama** - Initial work

## Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Email: support@lamaerp.com (if applicable)
- Documentation: See `/docs` folder

---

**Last Updated**: December 2025
**Version**: 1.0.0-beta

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This system is in active development. Before deploying to production, ensure all security considerations mentioned above are addressed.
