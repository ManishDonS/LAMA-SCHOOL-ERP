FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o expense-service .

FROM alpine:latest
RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

COPY --from=builder /app/expense-service .

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:3010/health || exit 1

CMD ["./expense-service"]
