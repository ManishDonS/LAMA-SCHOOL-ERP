#!/bin/bash

# Script to seed admin users for all tenant databases
# Usage: ./scripts/seed-tenant-admins.sh

set -e

echo "=== Tenant Admin User Seeding Script ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default admin credentials (can be overridden)
DEFAULT_ADMIN_EMAIL="${ADMIN_EMAIL:-admin@school.com}"
DEFAULT_ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@1234}"
DEFAULT_ADMIN_FIRST_NAME="${ADMIN_FIRST_NAME:-Admin}"
DEFAULT_ADMIN_LAST_NAME="${ADMIN_LAST_NAME:-User}"

echo "Admin credentials:"
echo "  Email: $DEFAULT_ADMIN_EMAIL"
echo "  Password: ********"
echo ""

# Get all tenants from schools table
echo "Fetching all tenants from schools table..."
TENANTS=$(docker exec school-erp-postgres psql -U postgres -d school_erp -t -c "SELECT code, name, db_name, db_user FROM schools WHERE code != 'system' ORDER BY code;")

if [ -z "$TENANTS" ]; then
    echo -e "${YELLOW}No tenants found in schools table${NC}"
    exit 0
fi

echo ""
echo "Seeding admin users for tenant databases..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=0
SEEDED=0
SKIPPED=0
FAILED=0

# Generate password hash using bcrypt (cost 12, same as the app)
echo "Generating password hash..."
PASSWORD_HASH=$(docker exec school-erp-auth sh -c "echo '$DEFAULT_ADMIN_PASSWORD' | /app/auth-service hash-password 2>/dev/null || echo ''")

# If hash-password command doesn't exist, use a pre-generated hash for Admin@1234
if [ -z "$PASSWORD_HASH" ]; then
    echo -e "${YELLOW}Using pre-generated password hash${NC}"
    # This is bcrypt hash for "Admin@1234" with cost 12
    PASSWORD_HASH='$2a$12$iRaEgzJBhYQK6PC3qeks2e/n8fFaqeAu36UPiHz/NzpR9YXl9/OG.'
fi

echo "Password hash generated"
echo ""

while IFS='|' read -r code school_name db_name db_user; do
    # Trim whitespace
    code=$(echo "$code" | xargs)
    school_name=$(echo "$school_name" | xargs)
    db_name=$(echo "$db_name" | xargs)
    db_user=$(echo "$db_user" | xargs)
    
    if [ -z "$code" ]; then
        continue
    fi
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "${BLUE}Processing tenant: $code${NC}"
    echo "  School: $school_name"
    echo "  Database: $db_name"
    
    # Check if admin user already exists
    USER_EXISTS=$(docker exec school-erp-postgres psql -U "$db_user" -d "$db_name" -t -c "SELECT 1 FROM users WHERE email = '$DEFAULT_ADMIN_EMAIL';" 2>/dev/null | xargs || echo "")
    
    if [ "$USER_EXISTS" = "1" ]; then
        echo -e "  ${GREEN}✓ Admin user already exists, skipping${NC}"
        SKIPPED=$((SKIPPED + 1))
        echo ""
        continue
    fi
    
    # Generate UUID for user
    USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    
    # Create admin user
    echo "  Creating admin user..."
    if docker exec school-erp-postgres psql -U "$db_user" -d "$db_name" -c "
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
        VALUES (
            '$USER_ID',
            '$DEFAULT_ADMIN_EMAIL',
            '$PASSWORD_HASH',
            '$DEFAULT_ADMIN_FIRST_NAME',
            '$DEFAULT_ADMIN_LAST_NAME',
            'admin',
            'active',
            NOW(),
            NOW()
        );
    " > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Admin user created${NC}"
        
        # Get or create Admin role
        echo "  Assigning admin role..."
        ADMIN_ROLE_ID=$(docker exec school-erp-postgres psql -U "$db_user" -d "$db_name" -t -c "SELECT id FROM roles WHERE name = 'Admin' LIMIT 1;" 2>/dev/null | xargs || echo "")
        
        if [ -z "$ADMIN_ROLE_ID" ]; then
            # Create Admin role if it doesn't exist
            ADMIN_ROLE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
            docker exec school-erp-postgres psql -U "$db_user" -d "$db_name" -c "
                INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
                VALUES (
                    '$ADMIN_ROLE_ID',
                    'Admin',
                    'Administrator with full access',
                    true,
                    NOW(),
                    NOW()
                );
            " > /dev/null 2>&1
        fi
        
        # Assign role to user
        docker exec school-erp-postgres psql -U "$db_user" -d "$db_name" -c "
            INSERT INTO user_roles (user_id, role_id)
            VALUES (
                '$USER_ID',
                '$ADMIN_ROLE_ID'
            );
        " > /dev/null 2>&1
        
        echo -e "  ${GREEN}✓ Admin role assigned${NC}"
        echo -e "  ${GREEN}✓ User ID: $USER_ID${NC}"
        
        SEEDED=$((SEEDED + 1))
    else
        echo -e "  ${RED}✗ Failed to create admin user${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
done <<< "$TENANTS"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  Total tenants: $TOTAL"
echo -e "  ${GREEN}Newly seeded: $SEEDED${NC}"
echo -e "  ${BLUE}Already existed: $SKIPPED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ "$SEEDED" -gt 0 ]; then
    echo -e "${GREEN}✓ Admin users seeded successfully!${NC}"
    echo ""
    echo "Login credentials for all tenants:"
    echo "  Email: $DEFAULT_ADMIN_EMAIL"
    echo "  Password: $DEFAULT_ADMIN_PASSWORD"
    echo ""
fi

if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}⚠ Some tenants failed. Please review the output above.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All tenant admin users are ready!${NC}"
    exit 0
fi
