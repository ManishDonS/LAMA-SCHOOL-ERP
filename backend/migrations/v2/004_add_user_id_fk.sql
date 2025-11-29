-- Add user_id foreign key to teachers and guardians tables
-- This creates a relationship between user accounts and their profiles

-- Add user_id foreign key to teachers and guardians tables
-- This creates a relationship between user accounts and their profiles

-- Add user_id column to teachers table if it doesn't exist
ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_teachers_user_id') THEN
        ALTER TABLE teachers ADD CONSTRAINT fk_teachers_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- Add user_id column to guardians table if it doesn't exist
ALTER TABLE IF EXISTS guardians ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_guardians_user_id') THEN
        ALTER TABLE guardians ADD CONSTRAINT fk_guardians_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON guardians(user_id);

-- Update existing records to link with user accounts by email (if user exists)
UPDATE teachers t
SET user_id = u.id
FROM users u
WHERE t.email = u.email 
  AND t.user_id IS NULL;

UPDATE guardians g
SET user_id = u.id
FROM users u
WHERE g.email = u.email 
  AND g.user_id IS NULL;
