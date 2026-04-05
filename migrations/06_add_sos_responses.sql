-- Migration: Add sos_responses table and resolved_at column to sos_alerts
-- Required by sosController.resolveSOS and respondSOS

CREATE TABLE IF NOT EXISTS sos_responses (
    id SERIAL PRIMARY KEY,
    sos_id INTEGER REFERENCES sos_alerts(id) ON DELETE CASCADE,
    responder_id INTEGER REFERENCES users(id),
    responder_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_responses_sos_id ON sos_responses(sos_id);

ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

SELECT 'SOS responses table and resolved_at column added successfully!' AS status;
