package database

import (
	"database/sql"
	"fmt"
	"log"

	"school-erp/accounting/config"

	_ "github.com/lib/pq"
)

func InitDB(cfg *config.Config) (*sql.DB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	log.Println("Database connection established")
	return db, nil
}

func RunMigrations(db *sql.DB) error {
	migrations := []string{
		`
		CREATE TABLE IF NOT EXISTS accounts (
			id BIGSERIAL PRIMARY KEY,
			code VARCHAR(50) UNIQUE NOT NULL,
			name VARCHAR(255) NOT NULL,
			type VARCHAR(50) NOT NULL CHECK (type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
			parent_id BIGINT REFERENCES accounts(id) ON DELETE RESTRICT,
			description TEXT,
			balance DECIMAL(15,2) DEFAULT 0.00,
			opening_balance DECIMAL(15,2) DEFAULT 0.00,
			is_active BOOLEAN DEFAULT true,
			level INTEGER DEFAULT 0,
			school_id BIGINT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		`,
		`CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);`,
		`CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);`,
		`CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_id);`,
		`CREATE INDEX IF NOT EXISTS idx_accounts_school ON accounts(school_id);`,
		`
		CREATE TABLE IF NOT EXISTS account_transactions (
			id BIGSERIAL PRIMARY KEY,
			account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
			date TIMESTAMP NOT NULL,
			description TEXT,
			debit_amount DECIMAL(15,2) DEFAULT 0.00,
			credit_amount DECIMAL(15,2) DEFAULT 0.00,
			balance DECIMAL(15,2) NOT NULL,
			reference_type VARCHAR(50),
			reference_id BIGINT,
			created_by BIGINT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_account ON account_transactions(account_id);`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_date ON account_transactions(date);`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_reference ON account_transactions(reference_type, reference_id);`,
		`
		CREATE TABLE IF NOT EXISTS account_audit_logs (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT,
			action VARCHAR(50) NOT NULL,
			entity VARCHAR(50) NOT NULL,
			entity_id BIGINT NOT NULL,
			details TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		`,
		`CREATE INDEX IF NOT EXISTS idx_account_audit_logs_entity ON account_audit_logs(entity, entity_id);`,
		`CREATE INDEX IF NOT EXISTS idx_account_audit_logs_created_at ON account_audit_logs(created_at);`,
		`CREATE INDEX IF NOT EXISTS idx_account_audit_logs_entity ON account_audit_logs(entity, entity_id);`,
		`CREATE INDEX IF NOT EXISTS idx_account_audit_logs_created_at ON account_audit_logs(created_at);`,
		`
		CREATE TABLE IF NOT EXISTS account_templates (
			id BIGSERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			type VARCHAR(50) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		`,
		`
		CREATE TABLE IF NOT EXISTS account_template_items (
			id BIGSERIAL PRIMARY KEY,
			template_id BIGINT NOT NULL REFERENCES account_templates(id) ON DELETE CASCADE,
			code VARCHAR(50) NOT NULL,
			name VARCHAR(255) NOT NULL,
			type VARCHAR(50) NOT NULL,
			parent_code VARCHAR(50),
			description TEXT
		);
		`,
		`CREATE INDEX IF NOT EXISTS idx_template_items_template ON account_template_items(template_id);`,
		`
		CREATE TABLE IF NOT EXISTS account_budgets (
			id BIGSERIAL PRIMARY KEY,
			account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			fiscal_year INTEGER NOT NULL,
			amount DECIMAL(15,2) DEFAULT 0.00,
			notes TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(account_id, fiscal_year)
		);
		`,
		`CREATE INDEX IF NOT EXISTS idx_budgets_account_year ON account_budgets(account_id, fiscal_year);`,
		`
		CREATE TABLE IF NOT EXISTS reconciliations (
			id BIGSERIAL PRIMARY KEY,
			account_id BIGINT NOT NULL REFERENCES accounts(id),
			statement_date DATE NOT NULL,
			starting_balance DECIMAL(15,2) NOT NULL,
			ending_balance DECIMAL(15,2) NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, COMPLETED
			notes TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		`,
		`CREATE INDEX IF NOT EXISTS idx_reconciliations_account ON reconciliations(account_id);`,
	}

	for i, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			return fmt.Errorf("error running migration %d: %w", i+1, err)
		}
	}

	// Seed templates if empty
	var count int
	db.QueryRow("SELECT COUNT(*) FROM account_templates").Scan(&count)
	if count == 0 {
		seedTemplates(db)
	}

	log.Println("Migrations completed successfully")
	return nil
}

func seedTemplates(db *sql.DB) {
	// K-12 School Template
	var templateID int64
	err := db.QueryRow(`
		INSERT INTO account_templates (name, description, type)
		VALUES ('Standard K-12 School', 'Standard chart of accounts for K-12 schools', 'K-12')
		RETURNING id
	`).Scan(&templateID)

	if err == nil {
		items := []struct {
			Code, Name, Type, ParentCode, Desc string
		}{
			// Assets
			{"1000", "Assets", "Asset", "", "Total Assets"},
			{"1100", "Current Assets", "Asset", "1000", ""},
			{"1110", "Cash on Hand", "Asset", "1100", ""},
			{"1120", "Bank Accounts", "Asset", "1100", ""},
			{"1200", "Fixed Assets", "Asset", "1000", ""},
			{"1210", "Buildings", "Asset", "1200", ""},
			{"1220", "Furniture & Fixtures", "Asset", "1200", ""},

			// Liabilities
			{"2000", "Liabilities", "Liability", "", "Total Liabilities"},
			{"2100", "Current Liabilities", "Liability", "2000", ""},
			{"2110", "Accounts Payable", "Liability", "2100", ""},
			{"2120", "Salary Payable", "Liability", "2100", ""},

			// Income
			{"4000", "Revenue", "Revenue", "", "Total Revenue"},
			{"4100", "Tuition Fees", "Revenue", "4000", ""},
			{"4200", "Transport Fees", "Revenue", "4000", ""},
			{"4300", "Hostel Fees", "Revenue", "4000", ""},

			// Expenses
			{"5000", "Expenses", "Expense", "", "Total Expenses"},
			{"5100", "Staff Salaries", "Expense", "5000", ""},
			{"5200", "Maintenance", "Expense", "5000", ""},
			{"5300", "Utilities", "Expense", "5000", ""},
			{"5400", "Educational Materials", "Expense", "5000", ""},
		}

		for _, item := range items {
			var pCode *string
			if item.ParentCode != "" {
				s := item.ParentCode
				pCode = &s
			}
			db.Exec(`
				INSERT INTO account_template_items (template_id, code, name, type, parent_code, description)
				VALUES ($1, $2, $3, $4, $5, $6)
			`, templateID, item.Code, item.Name, item.Type, pCode, item.Desc)
		}
	}
}
