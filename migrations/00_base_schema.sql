-- Base Database Schema for Society Management System
-- This creates all core tables from scratch

-- 1. Societies table
CREATE TABLE IF NOT EXISTS societies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    total_units INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active',
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP,
    registration_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'resident',
    block VARCHAR(10),
    flat_number VARCHAR(20),
    password_hash VARCHAR(255),
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_first_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. OTP codes table (for mobile/email login)
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    phone VARCHAR(20),
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3.1. OTPs table (for admin login and password changes)
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) UNIQUE NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'resident',
    created_by INTEGER REFERENCES users(id),
    used BOOLEAN DEFAULT FALSE,
    used_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'general',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Polls table
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    question TEXT NOT NULL,
    options JSONB,
    expires_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id),
    user_id INTEGER REFERENCES users(id),
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Visitors table
CREATE TABLE IF NOT EXISTS visitors (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    purpose TEXT,
    flat_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Gate passes table
CREATE TABLE IF NOT EXISTS gate_passes (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    vehicle_number VARCHAR(50),
    purpose TEXT,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Parking slots table
CREATE TABLE IF NOT EXISTS parking_slots (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    slot_number VARCHAR(50) NOT NULL,
    type VARCHAR(50) DEFAULT 'resident',
    flat_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(50),
    model VARCHAR(100),
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Delivery logs table
CREATE TABLE IF NOT EXISTS delivery_logs (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    recipient_name VARCHAR(255),
    flat_number VARCHAR(20),
    phone VARCHAR(20),
    item_description TEXT,
    company VARCHAR(100),
    delivery_person VARCHAR(255),
    guard_id INTEGER REFERENCES users(id),
    pass_code VARCHAR(255),
    preapproved BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending',
    entry_time TIMESTAMP DEFAULT NOW(),
    exit_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 14. Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 15. Maintenance bills table
    CREATE TABLE IF NOT EXISTS maintenance_bills (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    flat_number VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    month VARCHAR(50),
    year INTEGER,
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 16. Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    order_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 17. SOS alerts table
CREATE TABLE IF NOT EXISTS sos_alerts (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255),
    block VARCHAR(10),
    flat VARCHAR(20),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    message TEXT,
    emergency_type VARCHAR(50),
    emergency_service VARCHAR(100),
    trigger_buzzer BOOLEAN DEFAULT FALSE,
    auto_called BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 18. Emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL',
    priority VARCHAR(50) DEFAULT 'HIGH',
    target_scope VARCHAR(50) DEFAULT 'all',
    target_block VARCHAR(10),
    target_flat VARCHAR(20),
    target_role VARCHAR(50),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 19. Staff table
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    staff_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    staff_role VARCHAR(100),
    shift VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 20. Flats table
CREATE TABLE IF NOT EXISTS flats (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    flat_number VARCHAR(20) NOT NULL,
    block VARCHAR(10),
    floor INTEGER,
    owner_name VARCHAR(255),
    owner_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 21. Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE,
    location VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 22. Activity feed table
CREATE TABLE IF NOT EXISTS activity_feed (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 23. Notices table  
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    society_id INTEGER REFERENCES societies(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    category VARCHAR(50) DEFAULT 'general',
    pinned BOOLEAN DEFAULT FALSE,
    target_audience VARCHAR(50) DEFAULT 'all',
    target_block VARCHAR(10),
    target_flat VARCHAR(20),
    target_role VARCHAR(50),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_society_id ON users(society_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_complaints_society_id ON complaints(society_id);
CREATE INDEX IF NOT EXISTS idx_announcements_society_id ON announcements(society_id);
CREATE INDEX IF NOT EXISTS idx_polls_society_id ON polls(society_id);
CREATE INDEX IF NOT EXISTS idx_visitors_society_id ON visitors(society_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_society_id ON parking_slots(society_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_society_id ON delivery_logs(society_id);
CREATE INDEX IF NOT EXISTS idx_documents_society_id ON documents(society_id);
CREATE INDEX IF NOT EXISTS idx_staff_society_id ON staff(society_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_society_id ON gate_passes(society_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_bills_society_id ON maintenance_bills(society_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_society_id ON sos_alerts(society_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_society_id ON emergency_alerts(society_id);
CREATE INDEX IF NOT EXISTS idx_flats_society_id ON flats(society_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_society_id ON vehicles(society_id);
CREATE INDEX IF NOT EXISTS idx_payments_society_id ON payments(society_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_society_id ON activity_feed(society_id);
CREATE INDEX IF NOT EXISTS idx_notices_society_id ON notices(society_id);

SELECT 'Base schema created successfully!' AS status;
