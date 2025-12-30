package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunMigrations(pool *pgxpool.Pool) error {
	migrations := []string{
		createExpenseCategoriesTable,
		convertIdTypes,
		createExpensesTable,
		createExpenseReceiptsTable,
		createExpenseApprovalsTable,
		createBudgetAllocationsTable,
		createExpenseCommentsTable,
	}

	for _, migration := range migrations {
		if _, err := pool.Exec(context.Background(), migration); err != nil {
			log.Printf("Error running migration: %v", err)
			return err
		}
	}

	log.Println("✓ Expense service migrations completed")
	return nil
}

const createExpenseCategoriesTable = `
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    budget_monthly DECIMAL(12, 2),
    budget_yearly DECIMAL(12, 2),
    color VARCHAR(7),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_school ON expense_categories(school_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);
`

const createExpensesTable = `
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    department_id VARCHAR(100),
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    vendor_name VARCHAR(255),
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20),
    created_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'paid')),
    CONSTRAINT valid_recurring_frequency CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('monthly', 'yearly'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_school_date ON expenses(school_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
`

const createExpenseReceiptsTable = `
CREATE TABLE IF NOT EXISTS expense_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_receipts_expense ON expense_receipts(expense_id);
`

const createExpenseApprovalsTable = `
CREATE TABLE IF NOT EXISTS expense_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL,
    approval_level INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending',
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_approval_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_expense_approvals_expense ON expense_approvals(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_approver ON expense_approvals(approver_id);
`

const createBudgetAllocationsTable = `
CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
    department_id VARCHAR(100),
    fiscal_year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    allocated_amount DECIMAL(12, 2) NOT NULL,
    spent_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_month CHECK (month >= 1 AND month <= 12),
    UNIQUE(school_id, category_id, department_id, fiscal_year, month)
);

CREATE INDEX IF NOT EXISTS idx_budget_allocations_lookup ON budget_allocations(school_id, fiscal_year, month);
`

const createExpenseCommentsTable = `
CREATE TABLE IF NOT EXISTS expense_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_comments_expense ON expense_comments(expense_id);
`

const convertIdTypes = `
DO $$ 
BEGIN 
    -- 1. Convert expenses table columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='created_by' AND data_type='bigint') THEN
        ALTER TABLE expenses ALTER COLUMN created_by TYPE UUID USING '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='approved_by' AND data_type='bigint') THEN
        ALTER TABLE expenses ALTER COLUMN approved_by TYPE UUID USING NULL;
    END IF;

    -- 2. Convert expense_receipts table columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expense_receipts' AND column_name='uploaded_by' AND data_type='bigint') THEN
        ALTER TABLE expense_receipts ALTER COLUMN uploaded_by TYPE UUID USING '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;

    -- 3. Convert expense_approvals table columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expense_approvals' AND column_name='approver_id' AND data_type='bigint') THEN
        ALTER TABLE expense_approvals ALTER COLUMN approver_id TYPE UUID USING '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;

    -- 4. Convert expense_comments table columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expense_comments' AND column_name='user_id' AND data_type='bigint') THEN
        ALTER TABLE expense_comments ALTER COLUMN user_id TYPE UUID USING '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;

    -- 5. Optional: Handle school_id and department_id if they were bigint (unlikely but safe)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='school_id' AND data_type='bigint') THEN
        ALTER TABLE expenses ALTER COLUMN school_id TYPE VARCHAR(100) USING school_id::text;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='department_id' AND data_type='bigint') THEN
        ALTER TABLE expenses ALTER COLUMN department_id TYPE VARCHAR(100) USING department_id::text;
    END IF;
END $$;
`
