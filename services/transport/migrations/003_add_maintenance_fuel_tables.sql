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
