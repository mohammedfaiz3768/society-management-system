-- Add number_of_people field to gate_passes table for family gate passes
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS number_of_people INTEGER DEFAULT 1;

-- Add index for rate limiting queries (checking recent gate passes by phone)
CREATE INDEX IF NOT EXISTS idx_gate_passes_visitor_phone_created ON gate_passes(visitor_phone, created_at);
