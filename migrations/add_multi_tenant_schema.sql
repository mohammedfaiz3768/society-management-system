-- Multi-Tenant Society System Migration
-- This adds support for multiple societies with data isolation

-- 1. Create societies table
CREATE TABLE IF NOT EXISTS societies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id),
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE;

-- 3. Add society_id to all existing data tables
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE polls ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE delivery_logs ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE maintenance_bills ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE flats ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS society_id INTEGER REFERENCES societies(id);

-- 4. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_society_id ON users(society_id);
CREATE INDEX IF NOT EXISTS idx_complaints_society_id ON complaints(society_id);
CREATE INDEX IF NOT EXISTS idx_announcements_society_id ON announcements(society_id);
CREATE INDEX IF NOT EXISTS idx_polls_society_id ON polls(society_id);
CREATE INDEX IF NOT EXISTS idx_visitors_society_id ON visitors(society_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_society_id ON parking_slots(society_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_society_id ON delivery_logs(society_id);
CREATE INDEX IF NOT EXISTS idx_documents_society_id ON documents(society_id);
CREATE INDEX IF NOT EXISTS idx_staff_society_id ON staff(society_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_society_id ON gate_passes(society_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_society_id ON service_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_bills_society_id ON maintenance_bills(society_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_society_id ON sos_alerts(society_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_society_id ON emergency_alerts(society_id);
CREATE INDEX IF NOT EXISTS idx_events_society_id ON events(society_id);
CREATE INDEX IF NOT EXISTS idx_flats_society_id ON flats(society_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_society_id ON vehicles(society_id);
CREATE INDEX IF NOT EXISTS idx_invoices_society_id ON invoices(society_id);
CREATE INDEX IF NOT EXISTS idx_payments_society_id ON payments(society_id);

-- Success message
SELECT 'Multi-tenant schema migration completed successfully!' AS status;
