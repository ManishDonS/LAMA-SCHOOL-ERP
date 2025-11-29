.PHONY: help up down logs build migrate test clean dev-setup restart health lint format docker-push

# Load environment variables
include .env.example

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)School ERP - Available Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev-setup        - Setup development environment"
	@echo "  make up               - Start all services with docker-compose"
	@echo "  make down             - Stop all services"
	@echo "  make restart          - Restart all services"
	@echo "  make logs             - View logs from all services"
	@echo "  make logs-service     - View logs from specific service (make logs-service SERVICE=auth)"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make migrate          - Run database migrations for all services"
	@echo "  make migrate-auth     - Run Auth service migrations"
	@echo "  make db-reset         - Reset database (WARNING: drops all data)"
	@echo "  make db-seed          - Seed database with sample data"
	@echo ""
	@echo "$(GREEN)Code Quality:$(NC)"
	@echo "  make lint             - Run linters on all services"
	@echo "  make format           - Format code with gofmt"
	@echo "  make test             - Run tests for all services"
	@echo "  make test-service     - Run tests for specific service (make test-service SERVICE=auth)"
	@echo "  make coverage         - Generate test coverage report"
	@echo ""
	@echo "$(GREEN)Build & Deployment:$(NC)"
	@echo "  make build            - Build all service binaries"
	@echo "  make build-auth       - Build Auth service"
	@echo "  make docker-build     - Build all Docker images"
	@echo "  make docker-push      - Push images to registry (requires REGISTRY env var)"
	@echo ""
	@echo "$(GREEN)Infrastructure:$(NC)"
	@echo "  make health           - Check health status of all services"
	@echo "  make k8s-apply        - Apply Kubernetes manifests"
	@echo "  make k8s-delete       - Delete Kubernetes resources"
	@echo "  make helm-install     - Install Helm charts"
	@echo "  make helm-upgrade     - Upgrade Helm charts"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make clean            - Clean build artifacts and containers"
	@echo "  make deep-clean       - Remove all containers, volumes, and images"

# ==================== Development ====================

dev-setup:
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@cp .env.example .env 2>/dev/null || echo "$(BLUE).env.example already exists$(NC)"
	@cd services/auth && go mod download 2>/dev/null || true
	@cd services/user && go mod download 2>/dev/null || true
	@echo "$(GREEN)✓ Development environment ready$(NC)"

up:
	@echo "$(BLUE)Starting all services...$(NC)"
	docker-compose up -d
	@sleep 5
	@echo "$(GREEN)✓ Services started$(NC)"
	@make health

down:
	@echo "$(BLUE)Stopping all services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart:
	@echo "$(BLUE)Restarting services...$(NC)"
	docker-compose restart
	@sleep 3
	@make health

logs:
	docker-compose logs -f

logs-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE variable not set. Usage: make logs-service SERVICE=auth$(NC)"; \
		exit 1; \
	fi
	docker-compose logs -f $(SERVICE)-service

# ==================== Database ====================

migrate:
	@echo "$(BLUE)Running migrations...$(NC)"
	@echo "$(GREEN)Auth Service:$(NC)"
	@docker-compose exec -T postgres psql -U $(DB_USER) -d $(DB_NAME) -c "SELECT 1" > /dev/null && echo "Database connected" || exit 1
	@docker-compose exec -T auth-service /app/auth migrate-up || true
	@echo "$(GREEN)✓ Migrations completed$(NC)"

migrate-auth:
	@echo "$(BLUE)Running Auth service migrations...$(NC)"
	docker-compose exec -T auth-service /app/auth migrate-up

db-reset:
	@echo "$(RED)WARNING: This will delete all data. Continue? [y/N]$(NC)"
	@read -r response; if [ "$$response" = "y" ] || [ "$$response" = "Y" ]; then \
		echo "Resetting database..."; \
		docker-compose exec -T postgres psql -U $(DB_USER) -d $(DB_NAME) -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"; \
		make migrate; \
	fi

db-seed:
	@echo "$(BLUE)Seeding database...$(NC)"
	@docker-compose exec -T postgres psql -U $(DB_USER) -d $(DB_NAME) -f /scripts/seed.sql || echo "$(YELLOW)Seed script not found$(NC)"

# ==================== Code Quality ====================

lint:
	@echo "$(BLUE)Running linters...$(NC)"
	@for service in services/*/; do \
		if [ -f "$$service/main.go" ]; then \
			echo "$(GREEN)Linting $$(basename $$service)...$(NC)"; \
			cd $$service && golangci-lint run ./... || true; \
			cd - > /dev/null; \
		fi \
	done
	@echo "$(GREEN)✓ Linting completed$(NC)"

format:
	@echo "$(BLUE)Formatting code...$(NC)"
	@for service in services/*/; do \
		if [ -f "$$service/main.go" ]; then \
			echo "$(GREEN)Formatting $$(basename $$service)...$(NC)"; \
			gofmt -s -w $$service; \
		fi \
	done
	@echo "$(GREEN)✓ Code formatted$(NC)"

test:
	@echo "$(BLUE)Running tests...$(NC)"
	@for service in services/*/; do \
		if [ -f "$$service/main.go" ]; then \
			echo "$(GREEN)Testing $$(basename $$service)...$(NC)"; \
			cd $$service && go test -v ./... || true; \
			cd - > /dev/null; \
		fi \
	done
	@echo "$(GREEN)✓ Tests completed$(NC)"

test-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE variable not set. Usage: make test-service SERVICE=auth$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Testing $(SERVICE) service...$(NC)"
	cd services/$(SERVICE) && go test -v ./... && cd - > /dev/null

coverage:
	@echo "$(BLUE)Generating coverage reports...$(NC)"
	@for service in services/*/; do \
		if [ -f "$$service/main.go" ]; then \
			service_name=$$(basename $$service); \
			echo "$(GREEN)Coverage for $$service_name...$(NC)"; \
			cd $$service && go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html || true; \
			cd - > /dev/null; \
		fi \
	done

# ==================== Build ====================

build:
	@echo "$(BLUE)Building all services...$(NC)"
	@for service in services/*/; do \
		if [ -f "$$service/main.go" ]; then \
			service_name=$$(basename $$service); \
			echo "$(GREEN)Building $$service_name...$(NC)"; \
			cd $$service && go build -o bin/$$service_name . || true; \
			cd - > /dev/null; \
		fi \
	done
	@echo "$(GREEN)✓ Build completed$(NC)"

build-auth:
	@echo "$(BLUE)Building Auth service...$(NC)"
	cd services/auth && go build -o bin/auth . && cd - > /dev/null
	@echo "$(GREEN)✓ Auth service built$(NC)"

docker-build:
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)✓ Docker images built$(NC)"

docker-push:
	@if [ -z "$(REGISTRY)" ]; then \
		echo "$(RED)Error: REGISTRY variable not set$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Pushing images to $(REGISTRY)...$(NC)"
	@for service in services/*/; do \
		service_name=$$(basename $$service); \
		docker tag school-erp-$$service_name:latest $(REGISTRY)/school-erp-$$service_name:latest; \
		docker push $(REGISTRY)/school-erp-$$service_name:latest; \
	done
	@echo "$(GREEN)✓ Images pushed$(NC)"

# ==================== Health & Status ====================

health:
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "$(GREEN)Auth Service:$(NC)"
	@curl -s http://localhost:3001/health | jq . || echo "$(RED)✗ Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)User Service:$(NC)"
	@curl -s http://localhost:3002/health | jq . || echo "$(RED)✗ Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Student Service:$(NC)"
	@curl -s http://localhost:3003/health | jq . || echo "$(RED)✗ Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Attendance Service:$(NC)"
	@curl -s http://localhost:3004/health | jq . || echo "$(RED)✗ Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Fee Service:$(NC)"
	@curl -s http://localhost:3005/health | jq . || echo "$(RED)✗ Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Database (PostgreSQL):$(NC)"
	@docker-compose exec -T postgres pg_isready -U $(DB_USER) -d $(DB_NAME) > /dev/null 2>&1 && echo "✓ Connected" || echo "$(RED)✗ Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Cache (Redis):$(NC)"
	@docker-compose exec -T redis redis-cli ping > /dev/null 2>&1 && echo "✓ Connected" || echo "$(RED)✗ Not responding$(NC)"
	@echo ""

# ==================== Kubernetes ====================

k8s-apply:
	@echo "$(BLUE)Applying Kubernetes manifests...$(NC)"
	@kubectl apply -f infra/k8s/
	@echo "$(GREEN)✓ Kubernetes resources applied$(NC)"

k8s-delete:
	@echo "$(BLUE)Deleting Kubernetes resources...$(NC)"
	@kubectl delete -f infra/k8s/
	@echo "$(GREEN)✓ Kubernetes resources deleted$(NC)"

helm-install:
	@echo "$(BLUE)Installing Helm charts...$(NC)"
	helm install school-erp ./infra/helm/school-erp
	@echo "$(GREEN)✓ Helm charts installed$(NC)"

helm-upgrade:
	@echo "$(BLUE)Upgrading Helm charts...$(NC)"
	helm upgrade school-erp ./infra/helm/school-erp
	@echo "$(GREEN)✓ Helm charts upgraded$(NC)"

# ==================== Cleanup ====================

clean:
	@echo "$(BLUE)Cleaning up...$(NC)"
	@for service in services/*/; do \
		if [ -d "$$service/bin" ]; then \
			rm -rf "$$service/bin"; \
		fi \
	done
	@find . -name "*.out" -delete
	@find . -name "coverage.html" -delete
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

deep-clean:
	@echo "$(RED)WARNING: This will remove all containers, volumes, and images$(NC)"
	@read -r response; if [ "$$response" = "y" ] || [ "$$response" = "Y" ]; then \
		docker-compose down -v; \
		docker rmi $$(docker images | grep school-erp | awk '{print $$3}') 2>/dev/null || true; \
		make clean; \
		echo "$(GREEN)✓ Deep cleanup completed$(NC)"; \
	fi
