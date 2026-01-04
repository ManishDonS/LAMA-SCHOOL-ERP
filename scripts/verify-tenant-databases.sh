#!/bin/bash

# Script to verify all tenant databases are properly provisioned
# Usage: ./scripts/verify-tenant-databases.sh

set -e

echo "=== Tenant Database Verification Script ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get all tenants from schools table
echo "Fetching all tenants from schools table..."
TENANTS=$(docker exec school-erp-postgres psql -U postgres -d school_erp -t -c "SELECT code, db_name, db_user FROM schools WHERE code != 'system' ORDER BY code;")

if [ -z "$TENANTS" ]; then
    echo -e "${YELLOW}No tenants found in schools table${NC}"
    exit 0
fi

echo ""
echo "Checking tenant databases..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=0
SUCCESS=0
FAILED=0

while IFS='|' read -r code db_name db_user; do
    # Trim whitespace
    code=$(echo "$code" | xargs)
    db_name=$(echo "$db_name" | xargs)
    db_user=$(echo "$db_user" | xargs)
    
    if [ -z "$code" ]; then
        continue
    fi
    
    TOTAL=$((TOTAL + 1))
    
    echo "Tenant: $code"
    echo "  Database: $db_name"
    echo "  User: $db_user"
    
    # Check if user exists
    USER_EXISTS=$(docker exec school-erp-postgres psql -U postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname = '$db_user';" | xargs)
    
    # Check if database exists
    DB_EXISTS=$(docker exec school-erp-postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$db_name';" | xargs)
    
    # Check connection
    CONNECTION_OK=0
    if [ "$USER_EXISTS" = "1" ] && [ "$DB_EXISTS" = "1" ]; then
        if docker exec school-erp-postgres psql -U "$db_user" -d "$db_name" -c "SELECT 1;" > /dev/null 2>&1; then
            CONNECTION_OK=1
        fi
    fi
    
    # Report status
    if [ "$USER_EXISTS" != "1" ]; then
        echo -e "  ${RED}✗ User does not exist${NC}"
    else
        echo -e "  ${GREEN}✓ User exists${NC}"
    fi
    
    if [ "$DB_EXISTS" != "1" ]; then
        echo -e "  ${RED}✗ Database does not exist${NC}"
    else
        echo -e "  ${GREEN}✓ Database exists${NC}"
    fi
    
    if [ "$CONNECTION_OK" = "1" ]; then
        echo -e "  ${GREEN}✓ Connection successful${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "  ${RED}✗ Connection failed${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
done <<< "$TENANTS"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  Total tenants: $TOTAL"
echo -e "  ${GREEN}Healthy: $SUCCESS${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Some tenants have issues. Please review the output above.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All tenant databases are properly provisioned!${NC}"
    exit 0
fi
