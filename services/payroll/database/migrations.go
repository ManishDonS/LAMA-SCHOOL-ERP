package database

import (
	"database/sql"
	"log"
)

func RunMigrations(db *sql.DB) error {
	migrations := []string{
		// Payroll Structures Table
		`CREATE TABLE IF NOT EXISTS payroll_structures (
			id SERIAL PRIMARY KEY,
			staff_id VARCHAR(255) NOT NULL,
			staff_name VARCHAR(255) NOT NULL,
			staff_email VARCHAR(255) NOT NULL,
			department VARCHAR(255) NOT NULL,
			position VARCHAR(255) NOT NULL,
			basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
			hra DECIMAL(12, 2) DEFAULT 0,
			da DECIMAL(12, 2) DEFAULT 0,
			ta DECIMAL(12, 2) DEFAULT 0,
			medical_allowance DECIMAL(12, 2) DEFAULT 0,
			other_allowances DECIMAL(12, 2) DEFAULT 0,
			pf_deduction DECIMAL(12, 2) DEFAULT 0,
			tax_deduction DECIMAL(12, 2) DEFAULT 0,
			insurance_deduction DECIMAL(12, 2) DEFAULT 0,
			other_deductions DECIMAL(12, 2) DEFAULT 0,
			gross_salary DECIMAL(12, 2) GENERATED ALWAYS AS (
				basic_salary + COALESCE(hra, 0) + COALESCE(da, 0) + COALESCE(ta, 0) + 
				COALESCE(medical_allowance, 0) + COALESCE(other_allowances, 0)
			) STORED,
			net_salary DECIMAL(12, 2) GENERATED ALWAYS AS (
				basic_salary + COALESCE(hra, 0) + COALESCE(da, 0) + COALESCE(ta, 0) + 
				COALESCE(medical_allowance, 0) + COALESCE(other_allowances, 0) -
				COALESCE(pf_deduction, 0) - COALESCE(tax_deduction, 0) - 
				COALESCE(insurance_deduction, 0) - COALESCE(other_deductions, 0)
			) STORED,
			effective_from DATE NOT NULL,
			effective_to DATE,
			status VARCHAR(50) DEFAULT 'active',
			notes TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(staff_id, effective_from)
		)`,

		// Payroll Records Table
		`CREATE TABLE IF NOT EXISTS payroll_records (
			id SERIAL PRIMARY KEY,
			payroll_month VARCHAR(7) NOT NULL,
			staff_id VARCHAR(255) NOT NULL,
			staff_name VARCHAR(255) NOT NULL,
			department VARCHAR(255) NOT NULL,
			position VARCHAR(255) NOT NULL,
			basic_salary DECIMAL(12, 2) NOT NULL,
			total_allowances DECIMAL(12, 2) DEFAULT 0,
			total_deductions DECIMAL(12, 2) DEFAULT 0,
			gross_salary DECIMAL(12, 2) NOT NULL,
			net_salary DECIMAL(12, 2) NOT NULL,
			working_days INT DEFAULT 0,
			present_days INT DEFAULT 0,
			absent_days INT DEFAULT 0,
			leave_days INT DEFAULT 0,
			overtime_hours DECIMAL(5, 2) DEFAULT 0,
			overtime_amount DECIMAL(12, 2) DEFAULT 0,
			bonus DECIMAL(12, 2) DEFAULT 0,
			status VARCHAR(50) DEFAULT 'draft',
			approved_by VARCHAR(255),
			approved_at TIMESTAMP,
			processed_by VARCHAR(255),
			processed_at TIMESTAMP,
			notes TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(payroll_month, staff_id)
		)`,

		// Payroll Payments Table
		`CREATE TABLE IF NOT EXISTS payroll_payments (
			id SERIAL PRIMARY KEY,
			payroll_record_id INT NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
			staff_id VARCHAR(255) NOT NULL,
			staff_name VARCHAR(255) NOT NULL,
			payroll_month VARCHAR(7) NOT NULL,
			amount DECIMAL(12, 2) NOT NULL,
			payment_method VARCHAR(50) DEFAULT 'bank_transfer',
			payment_reference VARCHAR(255),
			payment_date DATE,
			status VARCHAR(50) DEFAULT 'pending',
			bank_name VARCHAR(255),
			account_number VARCHAR(255),
			notes TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Salary Slips Table
		`CREATE TABLE IF NOT EXISTS salary_slips (
			id SERIAL PRIMARY KEY,
			payroll_record_id INT NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
			staff_id VARCHAR(255) NOT NULL,
			staff_name VARCHAR(255) NOT NULL,
			staff_email VARCHAR(255) NOT NULL,
			payroll_month VARCHAR(7) NOT NULL,
			slip_number VARCHAR(100) UNIQUE NOT NULL,
			generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			sent_at TIMESTAMP,
			status VARCHAR(50) DEFAULT 'generated',
			pdf_path VARCHAR(500),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(payroll_record_id)
		)`,

		// Create indexes for better performance
		`CREATE INDEX IF NOT EXISTS idx_payroll_structures_staff_id ON payroll_structures(staff_id)`,
		`CREATE INDEX IF NOT EXISTS idx_payroll_structures_status ON payroll_structures(status)`,
		`CREATE INDEX IF NOT EXISTS idx_payroll_records_month ON payroll_records(payroll_month)`,
		`CREATE INDEX IF NOT EXISTS idx_payroll_records_staff_id ON payroll_records(staff_id)`,
		`CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON payroll_records(status)`,
		`CREATE INDEX IF NOT EXISTS idx_payroll_payments_staff_id ON payroll_payments(staff_id)`,
		`CREATE INDEX IF NOT EXISTS idx_payroll_payments_status ON payroll_payments(status)`,
		`CREATE INDEX IF NOT EXISTS idx_salary_slips_staff_id ON salary_slips(staff_id)`,
		`CREATE INDEX IF NOT EXISTS idx_salary_slips_month ON salary_slips(payroll_month)`,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			log.Printf("Migration error: %v", err)
			return err
		}
	}

	log.Println("All migrations completed successfully")
	return nil
}
