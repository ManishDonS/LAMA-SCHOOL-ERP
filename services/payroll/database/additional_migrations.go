package database

import (
	"database/sql"
	"log"
)

func RunAdditionalMigrations(db *sql.DB) error {
	migrations := []string{
		// Staff Loans Table
		`CREATE TABLE IF NOT EXISTS staff_loans (
			id SERIAL PRIMARY KEY,
			staff_id VARCHAR(255) NOT NULL,
			staff_name VARCHAR(255) NOT NULL,
			loan_amount DECIMAL(12, 2) NOT NULL,
			interest_rate DECIMAL(5, 2) DEFAULT 0,
			emi_amount DECIMAL(12, 2) NOT NULL,
			total_installments INT NOT NULL,
			paid_installments INT DEFAULT 0,
			outstanding_balance DECIMAL(12, 2) NOT NULL,
			loan_date DATE NOT NULL,
			status VARCHAR(50) DEFAULT 'pending',
			approved_by VARCHAR(255),
			approved_at TIMESTAMP,
			notes TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Loan Repayments Table
		`CREATE TABLE IF NOT EXISTS loan_repayments (
			id SERIAL PRIMARY KEY,
			loan_id INT NOT NULL REFERENCES staff_loans(id) ON DELETE CASCADE,
			payroll_record_id INT REFERENCES payroll_records(id),
			repayment_amount DECIMAL(12, 2) NOT NULL,
			repayment_date DATE NOT NULL,
			remaining_balance DECIMAL(12, 2) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Payment Batches Table
		`CREATE TABLE IF NOT EXISTS payment_batches (
			id SERIAL PRIMARY KEY,
			batch_number VARCHAR(100) UNIQUE NOT NULL,
			payroll_month VARCHAR(7) NOT NULL,
			total_amount DECIMAL(12, 2) NOT NULL,
			total_records INT NOT NULL,
			file_path VARCHAR(500),
			file_format VARCHAR(20),
			status VARCHAR(50) DEFAULT 'pending',
			created_by VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			processed_at TIMESTAMP
		)`,

		// Add tax_deduction column to payroll_records if not exists
		`ALTER TABLE payroll_records 
		 ADD COLUMN IF NOT EXISTS tax_deduction DECIMAL(12, 2) DEFAULT 0`,

		// Add loan_deduction column to payroll_records
		`ALTER TABLE payroll_records 
		 ADD COLUMN IF NOT EXISTS loan_deduction DECIMAL(12, 2) DEFAULT 0`,

		// Create indexes for loans
		`CREATE INDEX IF NOT EXISTS idx_staff_loans_staff_id ON staff_loans(staff_id)`,
		`CREATE INDEX IF NOT EXISTS idx_staff_loans_status ON staff_loans(status)`,
		`CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan_id ON loan_repayments(loan_id)`,
		`CREATE INDEX IF NOT EXISTS idx_payment_batches_month ON payment_batches(payroll_month)`,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			log.Printf("Additional migration error: %v", err)
			return err
		}
	}

	log.Println("All additional migrations completed successfully")
	return nil
}
