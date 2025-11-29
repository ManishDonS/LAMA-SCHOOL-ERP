# School ERP (Enterprise Resource Planning) System

A comprehensive, scalable microservices-based Enterprise Resource Planning system for schools. This system manages students, attendance, fees, exams, notifications, and real-time features using modern cloud-native technologies.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Management**: Authentication, authorization, and role-based access control
- **Student Management**: Create, update, and manage student records
- **Attendance Tracking**: Record and analyze student attendance
- **Fee Management**: Track and manage student fees
- **Exam Management**: Create exams and manage exam schedules
- **Notifications**: Send real-time notifications to students and parents
- **Real-time Updates**: WebSocket-based real-time communication
- **Reporting & Analytics**: Generate comprehensive reports
- **RESTful APIs**: Well-documented REST APIs for all services

## Architecture

The system is built using a microservices architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│                 (Web, Mobile, Desktop)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                  API Gateway (Port 3000)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼───┐        ┌───▼───┐       ┌───▼───┐
    │ User  │        │Student│       │Attend │
    │Service│        │Service│       │Service│
    └───────┘        └───────┘       └───────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
 ┌──▼───┐            ┌───▼──┐           ┌───▼────┐
 │ Fee  │            │ Exam │           │Notif   │
 │Service│            │Service│          │Service │
 └──────┘            └──────┘           └────────┘
         │                │                    │
         └────────────────┼────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
      ┌───▼────┐      ┌───▼────┐    ┌───▼──────┐
      │PostgreSQL      │ Redis  │    │  NATS    │
      │Database        │ Cache  │    │  Queue   │
      └────────┘       └────────┘    └──────────┘
```

## Tech Stack

### Backend
- **Language**: Go (Golang)
- **Framework**: Gin / Standard Library
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Queue**: NATS
- **API Gateway**: Node.js (Express.js)
- **Container**: Docker
- **Orchestration**: Kubernetes (Helm)
- **CI/CD**: GitHub Actions

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios / Fetch
- **Real-time**: Socket.io

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18.x or higher)
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)
- Make
- kubectl (for Kubernetes deployment)
- Helm (for Kubernetes deployment)

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

Edit `.env` and configure your environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/school_erp

# Redis
REDIS_URL=redis://redis:6379

# Services
USER_SERVICE_PORT=3001
STUDENT_SERVICE_PORT=3002
ATTENDANCE_SERVICE_PORT=3003
FEE_SERVICE_PORT=3004
EXAM_SERVICE_PORT=3005
NOTIFICATION_SERVICE_PORT=3006
REALTIME_SERVICE_PORT=3007

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API Gateway
API_GATEWAY_PORT=3000
```

### 3. Start Services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL Database
- Redis Cache
- NATS Message Queue
- All 7 microservices
- API Gateway

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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the frontend.

### API Endpoints

#### User Service (Port 3001)
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Student Service (Port 3002)
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

#### Attendance Service (Port 3003)
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/:id` - Get attendance details
- `GET /api/attendance/student/:id` - Get student attendance

#### Fee Service (Port 3004)
- `GET /api/fees` - List fee records
- `POST /api/fees` - Create fee record
- `PUT /api/fees/:id` - Update fee record
- `DELETE /api/fees/:id` - Delete fee record

#### Exam Service (Port 3005)
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

#### Notification Service (Port 3006)
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Send notification
- `DELETE /api/notifications/:id` - Delete notification

#### Real-time Service (Port 3007)
- WebSocket connections for real-time updates
- Socket.io namespace: `/realtime`

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
school-erp/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── pages/           # Next.js pages
│   │   ├── components/      # React components
│   │   ├── store/           # Zustand stores
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
├── services/                 # Go Microservices
│   ├── auth/                # Authentication service
│   ├── user/                # User management
│   ├── student/             # Student management
│   ├── attendance/          # Attendance tracking
│   ├── fee/                 # Fee management
│   ├── exam/                # Exam management
│   ├── notification/        # Notifications
│   ├── realtime/            # Real-time updates
│   └── school/              # School management
├── backend/
│   ├── api-gateway/         # Node.js API Gateway
│   ├── shared/              # Shared utilities
│   └── migrations/          # Database migrations
├── infra/                   # Infrastructure
│   ├── k8s/                 # Kubernetes manifests
│   └── helm/                # Helm charts
├── docker-compose.yml       # Docker Compose configuration
├── Makefile                 # Build automation
├── .env.example             # Environment variables template
└── README.md                # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use TypeScript for type safety
- Follow ESLint rules
- Write unit tests
- Document APIs
- Use semantic commits

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please create an issue on GitHub.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Automated SMS/Email notifications
- [ ] Integration with payment gateways
- [ ] Mobile biometric attendance
- [ ] Video conferencing for online classes
- [ ] Advanced reporting and BI features
- [ ] Multi-language support

## Authors

- **Your Name** - Initial work

---

**Last Updated**: November 2024
**Version**: 1.0.0
