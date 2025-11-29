CREATE TABLE IF NOT EXISTS transport_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings if they don't exist
INSERT INTO transport_settings (key, value) VALUES
    ('traccar_url', 'https://system.geotrack.com.np/api'),
    ('traccar_username', 'admin'),
    ('traccar_password', 'admin')
ON CONFLICT (key) DO NOTHING;
