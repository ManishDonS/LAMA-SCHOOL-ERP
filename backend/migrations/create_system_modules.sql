-- System Modules Table for API Gateway
CREATE TABLE IF NOT EXISTS system_modules (
  name VARCHAR(255) PRIMARY KEY,
  version VARCHAR(50),
  url VARCHAR(255),
  routes JSONB,
  manifest JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_modules_status ON system_modules(status);
