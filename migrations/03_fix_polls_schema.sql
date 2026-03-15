-- Migration: Fix polls schema to match controller expectations
-- The controller uses 'closes_at' but the schema has 'expires_at'
-- The controller uses a separate 'poll_options' table but the schema has inline JSONB 'options'
-- The controller uses 'option_id' in poll_votes but the schema has 'option_index'

-- 1. Add 'closes_at' column if it doesn't exist (controller uses this instead of expires_at)
ALTER TABLE polls ADD COLUMN IF NOT EXISTS closes_at TIMESTAMP;

-- Copy data from expires_at to closes_at if expires_at exists and closes_at is empty
UPDATE polls SET closes_at = expires_at WHERE closes_at IS NULL AND expires_at IS NOT NULL;

-- 2. Add 'type' column for poll type (single/multi vote)
ALTER TABLE polls ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'single';

-- 3. Create poll_options table (controller inserts options as separate rows)
CREATE TABLE IF NOT EXISTS poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Add 'option_id' to poll_votes (controller uses option_id referencing poll_options)
ALTER TABLE poll_votes ADD COLUMN IF NOT EXISTS option_id INTEGER REFERENCES poll_options(id);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);

SELECT 'Polls schema migration completed!' AS status;
