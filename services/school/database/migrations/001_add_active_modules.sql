-- +goose Up
-- +goose StatementBegin
ALTER TABLE schools ADD COLUMN IF NOT EXISTS active_modules JSONB NOT NULL DEFAULT '[]'::jsonb;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE schools DROP COLUMN IF EXISTS active_modules;
-- +goose StatementEnd
