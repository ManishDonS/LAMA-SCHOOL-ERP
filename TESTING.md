# Testing Guide - LAMA School ERP

## Overview

LAMA School ERP has a comprehensive testing strategy covering unit tests, integration tests, and benchmark tests. This document describes our testing practices, how to run tests, and how to write new tests.

## Table of Contents

- [Test Coverage Summary](#test-coverage-summary)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Testing Best Practices](#testing-best-practices)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## Test Coverage Summary

### Current Coverage

| Service | Unit Tests | Integration Tests | Coverage |
|---------|-----------|-------------------|----------|
| **Auth** | ✅ Complete | 🔄 In Progress | ~80% |
| School | 🔄 Planned | 🔄 Planned | 0% |
| User | 🔄 Planned | 🔄 Planned | 0% |
| Student | 🔄 Planned | 🔄 Planned | 0% |
| Other Services | 🔄 Planned | 🔄 Planned | 0% |

### Auth Service Test Coverage

**Utilities:**
- ✅ Password validation (11 test cases)
- ✅ Password hashing/verification (3 tests + 3 benchmarks)
- ✅ JWT token generation (8 test cases)
- ✅ JWT token verification (5 test cases)
- ✅ Token expiration handling (4 tests)
- ✅ Encryption/decryption (15 test cases + 5 benchmarks)
- ✅ PBKDF2 key derivation (3 tests)

**Total:** 49+ unit tests, 11 benchmark tests

## Running Tests

### Quick Start

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

### Using Go Test Directly

```bash
# Run all tests in auth service
cd services/auth
go test ./...

# Run tests with verbose output
go test -v ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test -run TestValidatePasswordComplexity ./utils

# Run benchmarks
go test -bench=. ./...

# Run benchmarks with memory stats
go test -bench=. -benchmem ./...
```

### Test Flags

| Flag | Description | Example |
|------|-------------|---------|
| `-v` | Verbose output | `go test -v ./...` |
| `-run` | Run specific test | `go test -run TestLogin` |
| `-bench` | Run benchmarks | `go test -bench=.` |
| `-benchmem` | Show memory stats | `go test -bench=. -benchmem` |
| `-cover` | Show coverage | `go test -cover ./...` |
| `-coverprofile` | Save coverage | `go test -coverprofile=coverage.out` |
| `-short` | Skip long tests | `go test -short ./...` |
| `-timeout` | Set timeout | `go test -timeout 30s` |
| `-parallel` | Parallel tests | `go test -parallel 4` |
| `-count` | Run N times | `go test -count=10` |

### Viewing Coverage Reports

```bash
# Generate coverage file
go test -coverprofile=coverage.out ./...

# View in terminal
go tool cover -func=coverage.out

# Generate HTML report
go tool cover -html=coverage.out -o coverage.html

# Open in browser (macOS)
open coverage.html

# Open in browser (Linux)
xdg-open coverage.html
```

## Writing Tests

### Test File Naming

Test files must end with `_test.go`:

```
password.go       → password_test.go
jwt.go            → jwt_test.go
auth_handler.go   → auth_handler_test.go
```

### Basic Test Structure

```go
package utils

import (
	"testing"
)

func TestFunctionName(t *testing.T) {
	// Arrange: Set up test data
	input := "test input"
	expected := "expected output"

	// Act: Call the function
	result := FunctionName(input)

	// Assert: Verify the result
	if result != expected {
		t.Errorf("FunctionName() = %v, want %v", result, expected)
	}
}
```

### Table-Driven Tests

**Best Practice:** Use table-driven tests for multiple test cases:

```go
func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{
			name:    "Valid email",
			email:   "user@example.com",
			wantErr: false,
		},
		{
			name:    "Invalid email - no @",
			email:   "userexample.com",
			wantErr: true,
		},
		{
			name:    "Invalid email - no domain",
			email:   "user@",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateEmail(tt.email)

			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateEmail() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
```

### Testing with Dependencies

#### Using Test Config

```go
func getTestConfig() *config.Config {
	return &config.Config{
		JWTSecret:          "test-jwt-secret",
		JWTRefreshSecret:   "test-refresh-secret",
		AccessTokenExpiry:  15 * time.Minute,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
	}
}

func TestGenerateToken(t *testing.T) {
	cfg := getTestConfig()

	token, err := GenerateToken(cfg, "user123", "admin")
	if err != nil {
		t.Fatalf("GenerateToken() failed: %v", err)
	}

	// Verify token
	if token == "" {
		t.Error("GenerateToken() returned empty token")
	}
}
```

#### Mocking Database

```go
// For unit tests, use interfaces and mocks
type UserRepository interface {
	GetUser(id string) (*User, error)
	CreateUser(user *User) error
}

// Mock implementation for testing
type MockUserRepo struct {
	users map[string]*User
}

func (m *MockUserRepo) GetUser(id string) (*User, error) {
	user, exists := m.users[id]
	if !exists {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func TestUserService(t *testing.T) {
	// Use mock instead of real database
	mockRepo := &MockUserRepo{
		users: map[string]*User{
			"123": {ID: "123", Email: "test@example.com"},
		},
	}

	service := NewUserService(mockRepo)

	user, err := service.GetUser("123")
	if err != nil {
		t.Fatalf("GetUser() failed: %v", err)
	}

	if user.Email != "test@example.com" {
		t.Errorf("Email = %v, want test@example.com", user.Email)
	}
}
```

### Benchmark Tests

Benchmark tests measure performance:

```go
func BenchmarkHashPassword(b *testing.B) {
	password := "TestPassword123!"
	cost := 12

	b.ResetTimer() // Reset timer after setup
	for i := 0; i < b.N; i++ {
		_, _ = HashPassword(password, cost)
	}
}

func BenchmarkGenerateToken(b *testing.B) {
	cfg := getTestConfig()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = GenerateToken(cfg, "user123", "admin")
	}
}
```

**Run benchmarks:**
```bash
go test -bench=.
go test -bench=. -benchmem  # With memory stats
go test -bench=BenchmarkHashPassword  # Specific benchmark
```

### Testing Concurrent Code

```go
func TestConcurrentEncryption(t *testing.T) {
	cipher, _ := NewCipher("test-key")

	done := make(chan bool)

	// Run 10 concurrent encryptions
	for i := 0; i < 10; i++ {
		go func(id int) {
			plaintext := "test-data"
			ciphertext, err := cipher.Encrypt(plaintext)
			if err != nil {
				t.Errorf("Concurrent encrypt %d failed: %v", id, err)
			}

			decrypted, err := cipher.Decrypt(ciphertext)
			if err != nil {
				t.Errorf("Concurrent decrypt %d failed: %v", id, err)
			}

			if decrypted != plaintext {
				t.Errorf("Concurrent test %d failed: got %v, want %v",
					id, decrypted, plaintext)
			}

			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}
}
```

### Testing Error Cases

Always test error cases:

```go
func TestDivide(t *testing.T) {
	tests := []struct {
		name      string
		a, b      int
		want      int
		wantErr   bool
		errMsg    string
	}{
		{
			name:    "Valid division",
			a:       10,
			b:       2,
			want:    5,
			wantErr: false,
		},
		{
			name:    "Division by zero",
			a:       10,
			b:       0,
			wantErr: true,
			errMsg:  "division by zero",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Divide(tt.a, tt.b)

			if tt.wantErr {
				if err == nil {
					t.Error("Divide() expected error but got none")
					return
				}
				if err.Error() != tt.errMsg {
					t.Errorf("Divide() error = %v, want %v",
						err.Error(), tt.errMsg)
				}
				return
			}

			if err != nil {
				t.Errorf("Divide() unexpected error: %v", err)
				return
			}

			if result != tt.want {
				t.Errorf("Divide() = %v, want %v", result, tt.want)
			}
		})
	}
}
```

## Test Structure

### Directory Structure

```
services/auth/
├── handlers/
│   ├── auth.go
│   └── auth_test.go          # Handler tests
├── utils/
│   ├── password.go
│   ├── password_test.go      # Password utility tests
│   ├── jwt.go
│   └── jwt_test.go           # JWT utility tests
├── pkg/
│   └── tenant/
│       ├── crypto.go
│       └── crypto_test.go    # Crypto tests
├── middleware/
│   ├── auth.go
│   └── auth_test.go          # Middleware tests
└── integration/
    └── api_test.go           # Integration tests
```

### Test Organization

**Unit Tests:**
- Test individual functions in isolation
- Use mocks for dependencies
- Fast execution (< 1ms per test)
- Located next to source files (`*_test.go`)

**Integration Tests:**
- Test full API endpoints
- Use real database (test database)
- Slower execution
- Located in `integration/` folder

**Benchmark Tests:**
- Measure performance
- Identify bottlenecks
- Track performance over time

## Testing Best Practices

### DO ✅

1. **Write tests first** (TDD when possible)
2. **Use table-driven tests** for multiple cases
3. **Test edge cases** (empty strings, nil values, max values)
4. **Test error conditions** (not just happy path)
5. **Use meaningful test names** (`TestValidateEmail_EmptyString`)
6. **Keep tests independent** (no shared state)
7. **Use setup/teardown** (`t.Cleanup()`)
8. **Mock external dependencies** (databases, APIs)
9. **Test concurrent code** with goroutines
10. **Write benchmarks** for critical paths

### DON'T ❌

1. **Don't skip error checks** in tests
2. **Don't use real production data**
3. **Don't make tests depend on each other**
4. **Don't hardcode file paths** (use `t.TempDir()`)
5. **Don't test implementation details**
6. **Don't ignore flaky tests** (fix them)
7. **Don't write slow tests** in unit test suites
8. **Don't use `time.Sleep()`** (use channels/waitgroups)
9. **Don't test third-party libraries**
10. **Don't commit commented-out tests**

### Test Naming Conventions

```go
// Good names
TestValidateEmail_ValidEmail
TestValidateEmail_EmptyString
TestValidateEmail_NoAtSign
TestGenerateToken_ValidUser
TestGenerateToken_ExpiredToken

// Bad names
TestValidate
TestCheck
Test1
TestEmail
```

### Setup and Teardown

```go
func TestMain(m *testing.M) {
	// Setup before all tests
	setupTestDatabase()

	// Run tests
	code := m.Run()

	// Teardown after all tests
	teardownTestDatabase()

	os.Exit(code)
}

func TestWithCleanup(t *testing.T) {
	// Create temp directory
	tmpDir := t.TempDir() // Automatically cleaned up

	// Or manual cleanup
	file, _ := os.CreateTemp("", "test")
	t.Cleanup(func() {
		os.Remove(file.Name())
	})

	// Test code...
}
```

### Testing HTTP Handlers

```go
func TestLoginHandler(t *testing.T) {
	// Create test request
	reqBody := `{"email":"user@example.com","password":"pass"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/login",
		strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	// Create response recorder
	w := httptest.NewRecorder()

	// Create Fiber app
	app := fiber.New()
	handler := NewAuthHandler(testDB, testCfg)
	app.Post("/api/v1/auth/login", handler.Login)

	// Perform request
	app.Test(req)

	// Assert response
	if w.Code != http.StatusOK {
		t.Errorf("Status = %v, want %v", w.Code, http.StatusOK)
	}

	// Parse response
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if response["access_token"] == nil {
		t.Error("Response missing access_token")
	}
}
```

## Continuous Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.20'

    - name: Run tests
      run: make test

    - name: Generate coverage
      run: make coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./services/*/coverage.out
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running tests before commit..."

# Run tests
make test

if [ $? -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi

echo "All tests passed!"
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Troubleshooting

### Common Issues

#### Tests Fail with "Connection Refused"

**Problem:** Database not running

**Solution:**
```bash
# Start services
docker-compose up -d postgres redis

# Or use test database
export DATABASE_URL="postgres://user:pass@localhost:5432/test_db"
```

#### Tests Pass Locally But Fail in CI

**Problem:** Different environment

**Solution:**
- Check environment variables
- Verify Go version matches
- Check for hardcoded paths
- Use `t.TempDir()` for temp files

#### Flaky Tests

**Problem:** Tests sometimes fail

**Solution:**
- Remove `time.Sleep()` calls
- Use proper synchronization (channels, mutexes)
- Don't rely on timing
- Increase timeouts if necessary

#### Slow Tests

**Problem:** Tests take too long

**Solution:**
```bash
# Use -short flag
go test -short ./...

# Run in parallel
go test -parallel 4 ./...

# Profile tests
go test -cpuprofile cpu.prof -memprofile mem.prof
```

### Getting Help

- Check [API.md](./API.md) for API examples
- Review [SECURITY.md](./SECURITY.md) for security testing
- See [README.md](./README.md) for setup instructions
- Create GitHub issue for test failures

## Test Coverage Goals

### Target Coverage

- **Critical Paths:** 90%+ (auth, encryption, payments)
- **Business Logic:** 80%+ (handlers, services)
- **Utilities:** 70%+ (helpers, formatters)
- **Overall Project:** 75%+

### Monitoring Coverage

```bash
# Check current coverage
make coverage

# View detailed coverage
go tool cover -func=coverage.out | grep total

# Set coverage requirement
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out | grep total | awk '{print $3}' | \
  sed 's/%//' | awk '{if ($1 < 75) exit 1}'
```

## Resources

- [Go Testing Documentation](https://golang.org/pkg/testing/)
- [Table-Driven Tests](https://dave.cheney.net/2019/05/07/prefer-table-driven-tests)
- [Test Coverage Best Practices](https://blog.golang.org/cover)
- [Advanced Testing with Go](https://www.youtube.com/watch?v=8hQG7QlcLBk)

---

**Last Updated:** December 2025
**Version:** 1.0.0-beta
