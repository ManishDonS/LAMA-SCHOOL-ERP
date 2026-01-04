#!/bin/bash

# Script to automatically provision missing tenant databases
# Usage: ./scripts/provision-missing-tenant-databases.sh

set -e

echo "=== Tenant Database Auto-Provisioning Script ==="
echo ""

# Get encryption key from .env
if [ -f ".env" ]; then
    ENCRYPTION_KEY=$(grep "^ENCRYPTION_KEY=" .env | cut -d '=' -f2)
else
    echo "Error: .env file not found"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "Error: ENCRYPTION_KEY not found in .env"
    exit 1
fi

echo "Using ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:20}..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get all tenants from schools table
echo "Fetching all tenants from schools table..."
TENANTS=$(docker exec school-erp-postgres psql -U postgres -d school_erp -t -c "SELECT code, db_name, db_user, db_password FROM schools WHERE code != 'system' ORDER BY code;")

if [ -z "$TENANTS" ]; then
    echo -e "${YELLOW}No tenants found in schools table${NC}"
    exit 0
fi

echo ""
echo "Checking and provisioning tenant databases..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=0
PROVISIONED=0
SKIPPED=0
FAILED=0

while IFS='|' read -r code db_name db_user encrypted_password; do
    # Trim whitespace
    code=$(echo "$code" | xargs)
    db_name=$(echo "$db_name" | xargs)
    db_user=$(echo "$db_user" | xargs)
    encrypted_password=$(echo "$encrypted_password" | xargs)
    
    if [ -z "$code" ]; then
        continue
    fi
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "${BLUE}Processing tenant: $code${NC}"
    echo "  Database: $db_name"
    echo "  User: $db_user"
    
    # Check if user exists
    USER_EXISTS=$(docker exec school-erp-postgres psql -U postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname = '$db_user';" | xargs)
    
    # Check if database exists
    DB_EXISTS=$(docker exec school-erp-postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$db_name';" | xargs)
    
    # If both exist, skip
    if [ "$USER_EXISTS" = "1" ] && [ "$DB_EXISTS" = "1" ]; then
        echo -e "  ${GREEN}✓ Already provisioned, skipping${NC}"
        SKIPPED=$((SKIPPED + 1))
        echo ""
        continue
    fi
    
    # Decrypt password
    echo "  Decrypting password..."
    cd services/auth/cmd/decrypt
    DECRYPTED_PASSWORD=$(ENCRYPTION_KEY="$ENCRYPTION_KEY" go run main.go "$encrypted_password" 2>/dev/null | grep "Decrypted password:" | cut -d ':' -f2 | xargs)
    cd ../../../../
    
    if [ -z "$DECRYPTED_PASSWORD" ]; then
        echo -e "  ${RED}✗ Failed to decrypt password${NC}"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi
    
    echo "  Password decrypted successfully"
    
    # Create user if doesn't exist
    if [ "$USER_EXISTS" != "1" ]; then
        echo "  Creating PostgreSQL user..."
        if docker exec school-erp-postgres psql -U postgres -c "CREATE USER \"$db_user\" WITH PASSWORD '$DECRYPTED_PASSWORD';" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓ User created${NC}"
        else
            echo -e "  ${RED}✗ Failed to create user${NC}"
            FAILED=$((FAILED + 1))
            echo ""
            continue
        fi
    else
        echo -e "  ${GREEN}✓ User already exists${NC}"
    fi
    
    # Create database if doesn't exist
    if [ "$DB_EXISTS" != "1" ]; then
        echo "  Creating database..."
        if docker exec school-erp-postgres psql -U postgres -c "CREATE DATABASE \"$db_name\" ENCODING 'UTF8' TEMPLATE template0;" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓ Database created${NC}"
        else
            echo -e "  ${RED}✗ Failed to create database${NC}"
            FAILED=$((FAILED + 1))
            echo ""
            continue
        fi
    else
        echo -e "  ${GREEN}✓ Database already exists${NC}"
    fi
    
    # Grant privileges
    echo "  Granting privileges..."
    docker exec school-erp-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"$db_name\" TO \"$db_user\";" > /dev/null 2>&1
    docker exec school-erp-postgres psql -U postgres -d "$db_name" -c "GRANT ALL ON SCHEMA public TO \"$db_user\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO \"$db_user\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO \"$db_user\";" > /dev/null 2>&1
    echo -e "  ${GREEN}✓ Privileges granted${NC}"
    
    # Test connection
    if docker exec school-erp-postgres psql -U "$db_user" -d "$db_name" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Connection test successful${NC}"
        PROVISIONED=$((PROVISIONED + 1))
    else
        echo -e "  ${RED}✗ Connection test failed${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
done <<< "$TENANTS"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  Total tenants: $TOTAL"
echo -e "  ${GREEN}Newly provisioned: $PROVISIONED${NC}"
echo -e "  ${BLUE}Already existed: $SKIPPED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ "$PROVISIONED" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Restarting auth service to clear connection cache...${NC}"
    docker restart school-erp-auth > /dev/null 2>&1
    echo -e "${GREEN}✓ Auth service restarted${NC}"
    echo ""
fi

if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}⚠ Some tenants failed to provision. Please review the output above.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All tenant databases are properly provisioned!${NC}"
    exit 0
fi
