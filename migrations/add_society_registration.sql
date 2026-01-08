-- Production Society Registration Schema
-- Run this migration to enable self-service registration

-- Add super admin capability
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_super_admin ON users(is_super_admin);

-- Enhance societies table for production
ALTER TABLE societies ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE societies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free_trial';
ALTER TABLE societies ADD COLUMN IF NOT EXISTS registration_token VARCHAR(255) UNIQUE;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(20);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_units INTEGER;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_societies_status ON societies(status);
CREATE INDEX IF NOT EXISTS idx_societies_trial_ends ON societies(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_societies_plan ON societies(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_societies_token ON societies(registration_token);

-- Add comments
COMMENT ON COLUMN societies.status IS 'pending, active, suspended, expired';
COMMENT ON COLUMN societies.trial_ends_at IS 'NULL means no trial or grandfathered';
COMMENT ON COLUMN societies.subscription_plan IS 'free_trial, basic, premium, enterprise';

-- Mark existing societies as active (grandfather clause)
UPDATE societies SET status = 'active', subscription_plan = 'grandfathered' WHERE status IS NULL;
