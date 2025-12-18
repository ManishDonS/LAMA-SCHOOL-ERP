#!/bin/bash

# Script to fix tenant database passwords when ENCRYPTION_KEY changes
# Usage: ./scripts/fix-tenant-passwords.sh

set -e

echo "=== Tenant Password Fix Script ==="
echo ""

# Get current encryption key from .env
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

# Set password for all tenant users in PostgreSQL
echo "Step 1: Resetting PostgreSQL passwords for all tenant users..."
docker exec school-erp-postgres psql -U postgres -c "
DO \$\$
DECLARE
    tenant_user TEXT;
BEGIN
    FOR tenant_user IN
        SELECT db_user FROM schools WHERE code != 'system'
    LOOP
        EXECUTE format('ALTER USER %I WITH PASSWORD ''postgres''', tenant_user);
        RAISE NOTICE 'Reset password for user: %', tenant_user;
    END LOOP;
END \$\$;
"

echo "✓ PostgreSQL passwords reset"
echo ""

# Encrypt the password using current encryption key
echo "Step 2: Encrypting password with current ENCRYPTION_KEY..."
cd services/auth/cmd/encrypt
ENCRYPTED_PASSWORD=$(ENCRYPTION_KEY="$ENCRYPTION_KEY" go run main.go postgres | grep "Encrypted password:" | cut -d ':' -f2 | xargs)
cd ../../../../

if [ -z "$ENCRYPTED_PASSWORD" ]; then
    echo "Error: Failed to encrypt password"
    exit 1
fi

echo "✓ Password encrypted: ${ENCRYPTED_PASSWORD:0:30}..."
echo ""

# Update all schools in database with new encrypted password
echo "Step 3: Updating schools table with encrypted passwords..."
docker exec school-erp-postgres psql -U postgres -d school_erp -c "
UPDATE schools
SET db_password = '$ENCRYPTED_PASSWORD'
WHERE code != 'system';

SELECT
    code,
    name,
    '✓ Updated' as status
FROM schools
WHERE code != 'system';
"

echo ""
echo "=== All tenant passwords fixed successfully! ==="
echo ""
echo "You can now login to all tenant schools with their credentials."
