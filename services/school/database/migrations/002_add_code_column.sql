-- +goose Up
-- +goose StatementBegin
ALTER TABLE schools ADD COLUMN IF NOT EXISTS code TEXT;
UPDATE schools SET code = 'SCH-' || id WHERE code IS NULL;
ALTER TABLE schools ALTER COLUMN code SET NOT NULL;
ALTER TABLE schools ADD CONSTRAINT schools_code_key UNIQUE (code);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE schools DROP COLUMN IF EXISTS code;
-- +goose StatementEnd
