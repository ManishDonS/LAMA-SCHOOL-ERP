-- Create default school if it doesn't exist
INSERT INTO schools (name, email, phone, address, city, state, subscription_status)
VALUES ('Default School', 'admin@school.com', '1234567890', 'Default Address', 'Default City', 'Default State', 'active')
ON CONFLICT (name) DO NOTHING;

-- Insert super admin user
-- Email: admin@school.com
-- Password: admin123
INSERT INTO users (school_id, email, password_hash, first_name, last_name, role, is_active)
SELECT
    s.id,
    'admin@school.com',
    '$2b$10$DUNDn27cb1Ehvl0C8hXSC.RZgGPVuJFxWUdbk/4DMDfFs.KdX2xcS',
    'Super',
    'Admin',
    'super_admin',
    true
FROM schools s
WHERE s.name = 'Default School'
ON CONFLICT (email) -- users constraint is on email
DO UPDATE SET
    password_hash = '$2b$10$DUNDn27cb1Ehvl0C8hXSC.RZgGPVuJFxWUdbk/4DMDfFs.KdX2xcS',
    role = 'super_admin',
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;

-- Verify the admin user was created
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    s.name as school_name
FROM users u
JOIN schools s ON u.school_id = s.id
WHERE u.email = 'admin@school.com';
