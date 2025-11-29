-- System Modules Table
CREATE TABLE IF NOT EXISTS system_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'inactive', -- active, inactive, error, installing
  url VARCHAR(255), -- Service URL (e.g., http://student-service:3000)
  routes JSONB DEFAULT '[]', -- List of routes handled by this module
  manifest JSONB, -- Full manifest backup
  is_core BOOLEAN DEFAULT FALSE, -- Core modules cannot be uninstalled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_modules_name ON system_modules(name);
CREATE INDEX IF NOT EXISTS idx_system_modules_status ON system_modules(status);

-- Grant privileges
ALTER TABLE system_modules OWNER TO postgres;
