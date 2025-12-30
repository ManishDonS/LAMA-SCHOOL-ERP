package database

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(db *pgxpool.Pool) error {
	migrations := []struct {
		name string
		sql  string
	}{
		{
			name: "001_init_transport_tables",
			sql: `
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number VARCHAR(50) NOT NULL UNIQUE,
    registration_no VARCHAR(50) NOT NULL UNIQUE,
    model VARCHAR(100),
    capacity INT NOT NULL,
    driver_id UUID,
    route_id UUID,
    status VARCHAR(20) DEFAULT 'Active',
    purchase_date DATE,
    last_service_date DATE,
    traccar_device_id VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    license_number VARCHAR(50) UNIQUE,
    license_expiry DATE,
    assigned_bus_id UUID,
    status VARCHAR(20) DEFAULT 'Active',
    join_date DATE,
    address TEXT,
    emergency_contact VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name VARCHAR(100) NOT NULL,
    route_number VARCHAR(50) NOT NULL UNIQUE,
    start_point VARCHAR(100),
    end_point VARCHAR(100),
    distance DECIMAL(10, 2),
    stops INT,
    assigned_bus_id UUID,
    departure_time TIME,
    arrival_time TIME,
    status VARCHAR(20) DEFAULT 'Active',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    student_name VARCHAR(100),
    bus_id UUID NOT NULL,
    route_id UUID NOT NULL,
    pickup_stop VARCHAR(100),
    dropoff_stop VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
			`,
		},
		{
			name: "002_add_settings_table",
			sql: `
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
			`,
		},
		{
			name: "003_add_maintenance_fuel_tables",
			sql: `
-- Add Maintenance Tables
CREATE TABLE IF NOT EXISTS bus_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(12, 2) DEFAULT 0,
    performed_by VARCHAR(100),
    next_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Fuel Log Tables
CREATE TABLE IF NOT EXISTS bus_fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    fuel_quantity DECIMAL(10, 2) NOT NULL, -- in liters or gallons
    cost DECIMAL(12, 2) NOT NULL,
    odometer_reading DECIMAL(12, 2),
    filled_by VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
			`,
		},
	}

	for _, migration := range migrations {
		log.Printf("Running migration: %s\n", migration.name)
		if _, err := db.Exec(context.Background(), migration.sql); err != nil {
			return fmt.Errorf("migration '%s' failed: %w", migration.name, err)
		}
		log.Printf("✓ Migration '%s' completed\n", migration.name)
	}

	return nil
}
