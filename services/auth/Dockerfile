# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Copy go mod files and vendor directory
COPY go.mod go.sum ./
COPY vendor ./vendor

# Copy source code
COPY . .

# Build the application using vendored dependencies
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -mod=vendor -a -installsuffix cgo -o auth-service .

# Final stage
FROM alpine:latest

# *** FIX APPLIED HERE: Added 'curl' for the health check ***
# 'wget' (which was used previously) is not included in the base Alpine image.
RUN apk --no-cache add ca-certificates tzdata curl

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/auth-service .
COPY --from=builder /app/docs ./docs

# Expose port
EXPOSE 3001

# Health check
# *** FIX APPLIED HERE: Changed CMD to use 'curl --fail' ***
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:3001/health || exit 1

CMD ["./auth-service"]