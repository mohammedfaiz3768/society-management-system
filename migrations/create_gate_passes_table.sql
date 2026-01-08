CREATE TABLE IF NOT EXISTS gate_passes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  type VARCHAR(50) DEFAULT 'Visitor', -- Visitor, Delivery, Cab
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, ENTERED, EXITED, EXPIRED, REJECTED
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP NOT NULL,
  vehicle_number VARCHAR(50),
  purpose TEXT,
  qr_code TEXT UNIQUE, -- Simple string/hash for QR verification
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  guard_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
