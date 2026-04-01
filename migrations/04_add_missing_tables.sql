-- Migration: Add missing tables (flat_members, visitor_parking, service_requests)
-- These tables are referenced by controllers but were not in the base schema.

CREATE TABLE IF NOT EXISTS flat_members (
    id SERIAL PRIMARY KEY,
    flat_id INTEGER REFERENCES flats(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    relation VARCHAR(50),
    added_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flat_members_flat_id ON flat_members(flat_id);

CREATE TABLE IF NOT EXISTS visitor_parking (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    visitor_name VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    purpose VARCHAR(255),
    flat_number VARCHAR(20),
    slot_number VARCHAR(20),
    guard_id INTEGER REFERENCES users(id),
    in_time TIMESTAMP DEFAULT NOW(),
    out_time TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visitor_parking_society_id ON visitor_parking(society_id);
CREATE INDEX IF NOT EXISTS idx_visitor_parking_in_time ON visitor_parking(in_time DESC);

CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    flat_number VARCHAR(20),
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to INTEGER REFERENCES staff(id),
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_society_id ON service_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    month_year VARCHAR(7) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    due_date DATE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_society_id ON invoices(society_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

SELECT 'Missing tables created successfully!' AS status;
