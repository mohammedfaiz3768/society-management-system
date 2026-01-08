-- Enhanced SOS System Database Migration
-- Adds columns for emergency services integration

ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS emergency_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS emergency_service VARCHAR(100);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS trigger_buzzer BOOLEAN DEFAULT FALSE;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS auto_called BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sos_emergency_type ON sos_alerts(emergency_type);
CREATE INDEX IF NOT EXISTS idx_sos_trigger_buzzer ON sos_alerts(trigger_buzzer);
CREATE INDEX IF NOT EXISTS idx_sos_society_status ON sos_alerts(society_id, status);

-- Comments
COMMENT ON COLUMN sos_alerts.emergency_type IS 'Type of emergency: fire, medical, police, general';
COMMENT ON COLUMN sos_alerts.emergency_service IS 'Emergency service that should be contacted';
COMMENT ON COLUMN sos_alerts.trigger_buzzer IS 'Whether to trigger buzzer on all resident devices';
COMMENT ON COLUMN sos_alerts.auto_called IS 'Whether emergency service was automatically called';
