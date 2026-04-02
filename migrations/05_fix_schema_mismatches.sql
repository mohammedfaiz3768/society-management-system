-- Migration: Fix schema mismatches between controllers and base schema
-- Adds missing columns and creates missing tables referenced by controllers

-- 1. flats: add owner_id (controllers use user FK, schema only had owner_name text)
ALTER TABLE flats ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);

-- 2. parking_slots: add assigned_to (controller uses this for slot assignment)
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id);

-- 3. vehicles: add flat_number (parkingController.addVehicle inserts with flat_number)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS flat_number VARCHAR(20);

-- 4. visitors: add columns used by visitorController and dashboardController
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS resident_id INTEGER REFERENCES users(id);
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS guard_id  INTEGER REFERENCES users(id);
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS approved  BOOLEAN DEFAULT FALSE;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS in_time   TIMESTAMP;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS out_time  TIMESTAMP;

-- 5. staff: add columns controllers use (schema has staff_name/staff_role; controllers use name/role)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS name       VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role       VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS shift_start TIME;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS shift_end   TIME;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status      VARCHAR(50) DEFAULT 'active';

-- Backfill name/role from existing staff_name/staff_role
UPDATE staff SET name = staff_name WHERE name IS NULL;
UPDATE staff SET role = staff_role WHERE role IS NULL;

-- 6. emergency_alerts: add status (dashboardController counts unresolved alerts)
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';

-- 7. service_requests: add completed_at (updateStatus sets this when completed)
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 7. Create deliveries table (deliveryController.addDelivery / getAllDeliveries / updateDeliveryStatus)
CREATE TABLE IF NOT EXISTS deliveries (
    id               SERIAL PRIMARY KEY,
    society_id       INTEGER REFERENCES societies(id),
    flat_number      VARCHAR(20) NOT NULL,
    recipient_name   VARCHAR(255),
    phone            VARCHAR(20),
    item_description TEXT,
    status           VARCHAR(50) DEFAULT 'pending',
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_society_id ON deliveries(society_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_flat_number ON deliveries(flat_number);

-- 8. Create delivery_pass table (deliveryController.createDeliveryPass / deliveryEntry)
CREATE TABLE IF NOT EXISTS delivery_pass (
    id          SERIAL PRIMARY KEY,
    society_id  INTEGER REFERENCES societies(id),
    resident_id INTEGER REFERENCES users(id),
    flat_number VARCHAR(20),
    company     VARCHAR(100),
    description TEXT,
    pass_code   VARCHAR(50) UNIQUE NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_pass_society_id ON delivery_pass(society_id);
CREATE INDEX IF NOT EXISTS idx_delivery_pass_resident_id ON delivery_pass(resident_id);

-- 9. Create staff_assignments table (staffController.assignStaffToResident etc.)
CREATE TABLE IF NOT EXISTS staff_assignments (
    id            SERIAL PRIMARY KEY,
    staff_id      INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    resident_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role          VARCHAR(100),
    working_days  TEXT,
    timings       TEXT,
    is_blocked    BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id    ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_resident_id ON staff_assignments(resident_id);

-- 10. Create staff_attendance table (staffController.staffCheckIn/staffCheckOut/markStaffEntry)
CREATE TABLE IF NOT EXISTS staff_attendance (
    id           SERIAL PRIMARY KEY,
    staff_id     INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    resident_id  INTEGER REFERENCES users(id),
    entry_date   DATE DEFAULT CURRENT_DATE,
    entry_time   TIMESTAMP DEFAULT NOW(),
    exit_time    TIMESTAMP,
    marked_by    INTEGER REFERENCES users(id),
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON staff_attendance(staff_id);

-- 11. Create staff_logs table (staffController.addStaffLog/getStaffLogs)
CREATE TABLE IF NOT EXISTS staff_logs (
    id         SERIAL PRIMARY KEY,
    staff_id   INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    log        TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Create staff_leaves table (staffController.markStaffLeave)
CREATE TABLE IF NOT EXISTS staff_leaves (
    id              SERIAL PRIMARY KEY,
    staff_id        INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    resident_id     INTEGER REFERENCES users(id),
    leave_date      DATE NOT NULL,
    reason          TEXT,
    marked_by_type  VARCHAR(50),
    marked_by       INTEGER REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 13. gate_passes: add columns needed by markEntry/markExit/verifyGatePass and mobile app schema
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS status       VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS entry_time   TIMESTAMP;
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS exit_time    TIMESTAMP;
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS guard_id     INTEGER REFERENCES users(id);
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP DEFAULT NOW();
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS valid_from   TIMESTAMP;
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS flat_number  VARCHAR(20);
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS block        VARCHAR(10);
ALTER TABLE gate_passes ADD COLUMN IF NOT EXISTS type         VARCHAR(50) DEFAULT 'Visitor';

SELECT 'Schema mismatch fixes applied successfully!' AS status;
