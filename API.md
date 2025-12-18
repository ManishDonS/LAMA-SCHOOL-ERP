# LAMA School ERP - API Documentation

## Overview

LAMA School ERP provides RESTful APIs for all 15 microservices. Each service exposes its API documentation through Swagger/OpenAPI specification, accessible via interactive Swagger UI.

## Table of Contents

- [Accessing API Documentation](#accessing-api-documentation)
- [Authentication](#authentication)
- [API Services](#api-services)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Accessing API Documentation

### Local Development

When running services locally with `docker-compose up`, Swagger UI is available for each service:

| Service | Port | Swagger UI URL |
|---------|------|----------------|
| **Auth Service** | 3001 | http://localhost:3001/swagger/ |
| School Service | 3011 | http://localhost:3011/swagger/ |
| User Service | 3002 | http://localhost:3002/swagger/ |
| Student Service | 3003 | http://localhost:3003/swagger/ |
| Attendance Service | 3004 | http://localhost:3004/swagger/ |
| Fee Service | 3005 | http://localhost:3005/swagger/ |
| Exam Service | 3006 | http://localhost:3006/swagger/ |
| Notification Service | 3007 | http://localhost:3007/swagger/ |
| Realtime Service | 3008 | http://localhost:3008/swagger/ |
| Transport Service | 3009 | http://localhost:3009/swagger/ |
| Expense Service | 3010 | http://localhost:3010/swagger/ |
| Payroll Service | 3012 | http://localhost:3012/swagger/ |
| Website Service | 3013 | http://localhost:3013/swagger/ |
| Communication Service | 8005 | http://localhost:8005/swagger/ |
| Accounting Service | 8009 | http://localhost:8009/swagger/ |

**Note**: Auth Service has complete Swagger documentation. Other services are in progress.

### Production

Access Swagger UI through your API gateway:
```
https://api.yourdomain.com/{service}/swagger/
```

**Security Note**: In production, consider:
- Restricting Swagger UI to internal networks only
- Using API key authentication for documentation access
- Disabling Swagger UI entirely and serving static OpenAPI specs

## Authentication

### Overview

All API endpoints (except `/login`, `/register`, `/health`) require authentication via JWT (JSON Web Token).

### Authentication Flow

1. **Login** to get access token:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

2. **Use Access Token** in subsequent requests:
```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGc..."
```

3. **Refresh Token** when access token expires (15 minutes):
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGc..."
  }'
```

### Token Lifespans

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

### Using Swagger UI with Authentication

1. Click the "Authorize" button in Swagger UI
2. Enter your JWT token: `Bearer {your-access-token}`
3. Click "Authorize"
4. All subsequent requests will include the token

## API Services

### 1. Auth Service (Port 3001)

**Base URL**: `/api/v1/auth`

**Endpoints**:
- `POST /login` - Authenticate user
- `POST /register` - Register new user
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user info
- `POST /logout` - Logout user

**Swagger**: http://localhost:3001/swagger/

### 2. School Service (Port 3011)

**Base URL**: `/api/v1/schools`

**Endpoints**:
- `POST /` - Create new school (super admin only)
- `GET /` - List all schools
- `GET /:id` - Get school details
- `PUT /:id` - Update school
- `POST /:id/logo` - Upload school logo
- `GET /:id/stats` - Get school statistics

**Requires**: `X-Tenant-Code` header for tenant-specific operations

### 3. User Service (Port 3002)

**Base URL**: `/api/v1/users`

**Endpoints**:
- `POST /` - Create user
- `GET /` - List users (with pagination)
- `GET /:id` - Get user details
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user
- `GET /:id/permissions` - Get user permissions

### 4. Student Service (Port 3003)

**Base URL**: `/api/v1/students`

**Endpoints**:
- `GET /` - List students (with filters)
- `POST /` - Create student
- `GET /:id` - Get student details
- `PUT /:id` - Update student
- `DELETE /:id` - Delete student
- `GET /:id/academic-history` - Get academic records

### 5. Attendance Service (Port 3004)

**Base URL**: `/api/v1/attendance`

**Endpoints**:
- `GET /` - List attendance records
- `POST /` - Mark attendance
- `GET /:id` - Get attendance details
- `GET /student/:id` - Get student attendance
- `GET /reports` - Generate attendance reports

### 6. Fee Service (Port 3005)

**Base URL**: `/api/v1/fees`

**Endpoints**:
- `GET /` - List fee records
- `POST /` - Create fee record
- `PUT /:id` - Update fee record
- `DELETE /:id` - Delete fee record
- `POST /:id/payment` - Record payment
- `GET /student/:id` - Get student fee history

### 7. Exam Service (Port 3006)

**Base URL**: `/api/v1/exams`

**Endpoints**:
- `GET /` - List exams
- `POST /` - Create exam
- `PUT /:id` - Update exam
- `DELETE /:id` - Delete exam
- `POST /:id/results` - Submit exam results
- `GET /:id/grades` - Get exam grades

### 8. Notification Service (Port 3007)

**Base URL**: `/api/v1/notifications`

**Endpoints**:
- `GET /` - List notifications
- `POST /` - Send notification
- `DELETE /:id` - Delete notification
- `GET /user/:id` - Get user notifications
- `PUT /:id/read` - Mark notification as read

### 9. Realtime Service (Port 3008)

**WebSocket Support**: Yes

**Features**:
- Live attendance updates
- Real-time notifications
- Event streaming via NATS

### 10. Transport Service (Port 3009)

**Base URL**: `/api/v1/transport`

**Endpoints**:
- `GET /vehicles` - List vehicles
- `POST /vehicles` - Add vehicle
- `GET /vehicles/:id/location` - Get GPS location (Traccar integration)
- `GET /routes` - List routes
- `POST /routes` - Create route

**Integration**: Traccar GPS tracking system

### 11. Expense Service (Port 3010)

**Base URL**: `/api/v1/expenses`

**Endpoints**:
- `GET /` - List expenses
- `POST /` - Create expense
- `PUT /:id` - Update expense
- `DELETE /:id` - Delete expense
- `GET /categories` - List expense categories
- `POST /:id/receipt` - Upload receipt

### 12. Payroll Service (Port 3012)

**Base URL**: `/api/v1/payroll`

**Endpoints**:
- `GET /employees` - List employees
- `POST /employees` - Add employee
- `GET /salaries` - List salary records
- `POST /process` - Process payroll
- `GET /reports` - Generate payroll reports

### 13. Website Service (Port 3013)

**Base URL**: `/api/v1/website`

**Endpoints**:
- `GET /pages` - List website pages
- `POST /generate` - AI-powered website generation (OpenAI/Gemini)
- `PUT /pages/:id` - Update page
- `POST /publish` - Publish website

**AI Integration**: OpenAI and Gemini API support

### 14. Communication Service (Port 8005)

**Base URL**: `/api/v1`

**Endpoints**:
- `GET /channels` - List communication channels
- `POST /channels` - Create new channel
- `POST /channels/:channelId/members` - Add member to channel
- `GET /channels/:channelId/messages` - Get channel messages
- `POST /channels/:channelId/messages` - Send message
- `GET /users` - List users for messaging

### 15. Accounting Service (Port 8009)

**Base URL**: `/api/v1/accounting`

**Endpoints**:
- `GET /accounts` - List accounts
- `POST /transactions` - Record transaction
- `GET /balance-sheet` - Get balance sheet
- `GET /income-statement` - Get income statement
- `GET /trial-balance` - Get trial balance

## Common Patterns

### Multi-Tenancy

Most services require the `X-Tenant-Code` header for tenant-specific operations:

```bash
curl -X GET http://localhost:3003/api/v1/students \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Code: school-abc"
```

Tenant code can also be provided via:
- **Subdomain**: `school-abc.yourdomain.com`
- **Query parameter**: `?tenant=school-abc`

### Pagination

List endpoints support pagination:

```bash
GET /api/v1/students?page=1&limit=20
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Filtering

Use query parameters for filtering:

```bash
GET /api/v1/students?class=10&section=A&status=active
```

### Sorting

```bash
GET /api/v1/students?sort_by=name&order=asc
```

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific error details"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

- `INVALID_CREDENTIALS` - Login failed
- `TOKEN_EXPIRED` - Access token expired
- `INVALID_TOKEN` - Malformed or invalid token
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `VALIDATION_ERROR` - Request validation failed
- `DUPLICATE_ENTRY` - Resource already exists

## Rate Limiting

**API Gateway Level**:
- 100 requests per 15 minutes per IP address
- Applies to all public endpoints

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**Rate Limit Exceeded**:
```json
HTTP/1.1 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "retry_after": 300
}
```

## Examples

### Example 1: Complete User Registration and Login Flow

```bash
# 1. Register new user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "school_id": "school-abc",
    "role": "teacher"
  }'

# 2. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "SecurePass123!"
  }'

# Save the access_token from response

# 3. Get current user info
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer {access_token}"
```

### Example 2: Create and Manage Student

```bash
# 1. Create student
curl -X POST http://localhost:3003/api/v1/students \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Code: school-abc" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@student.school.com",
    "class": "10",
    "section": "A",
    "roll_number": "101"
  }'

# 2. Get student details
curl -X GET http://localhost:3003/api/v1/students/{student_id} \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Code: school-abc"

# 3. Update student
curl -X PUT http://localhost:3003/api/v1/students/{student_id} \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Code: school-abc" \
  -H "Content-Type: application/json" \
  -d '{
    "section": "B"
  }'
```

### Example 3: Mark Attendance

```bash
curl -X POST http://localhost:3004/api/v1/attendance \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Code: school-abc" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "{student_id}",
    "date": "2025-12-18",
    "status": "present",
    "remarks": "On time"
  }'
```

### Example 4: Record Fee Payment

```bash
curl -X POST http://localhost:3005/api/v1/fees/{fee_id}/payment \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Code: school-abc" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "payment_method": "cash",
    "payment_date": "2025-12-18",
    "receipt_number": "REC-2025-001"
  }'
```

## Development Tools

### Using Postman

1. Import OpenAPI spec from Swagger UI
2. Create environment with:
   - `base_url`: http://localhost:3001
   - `access_token`: (obtained from login)
   - `tenant_code`: school-abc

### Using cURL

Save token for reuse:
```bash
export TOKEN="eyJhbGc..."
export TENANT="school-abc"

curl -X GET http://localhost:3003/api/v1/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT"
```

### Using httpie

```bash
http GET localhost:3003/api/v1/students \
  Authorization:"Bearer $TOKEN" \
  X-Tenant-Code:$TENANT
```

## API Versioning

Current version: **v1**

All endpoints are prefixed with `/api/v1/`

Future versions will be available at `/api/v2/`, `/api/v3/`, etc.

## Support

For API-related issues:
- Check Swagger UI for endpoint details
- Review [SECURITY.md](./SECURITY.md) for authentication issues
- See [README.md](./README.md) for setup instructions
- Create an issue on GitHub

## Contributing

When adding new endpoints:
1. Add Swagger annotations to handler functions
2. Generate Swagger docs: `swag init`
3. Test in Swagger UI
4. Update this API.md file
5. Add examples if endpoint is complex

---

**API Version**: 1.0.0
**Last Updated**: December 2025
**Documentation**: Swagger/OpenAPI 2.0
