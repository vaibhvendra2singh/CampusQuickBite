-- Run these SQL statements against your Supabase (or MySQL) database to enable Reset Password functionality

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMPTZ NULL;

-- Create an index to optimise query speeds when verifying token validation
CREATE INDEX IF NOT EXISTS idx_reset_token ON users(reset_token);
