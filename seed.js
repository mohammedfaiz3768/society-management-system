/**
 * Database Seed Script
 * Populates the database with demo data for testing and demonstration
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // 1. Create Demo Society
        console.log('📍 Creating demo society...');
        const societyResult = await pool.query(`
            INSERT INTO societies (name, address, city, state, pincode, total_units, status, subscription_plan, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (name) DO NOTHING
            RETURNING id
        `, [
            'Greenwood Residency',
            '123 Park Avenue, Sector 42',
            'Mumbai',
            'Maharashtra',
            '400001',
            100,
            'active',
            'trial'
        ]);

        let societyId;
        if (societyResult.rows.length > 0) {
            societyId = societyResult.rows[0].id;
            console.log(`✅ Demo society created (ID: ${societyId})\n`);
        } else {
            // Society already exists, fetch it
            const existing = await pool.query('SELECT id FROM societies WHERE name = $1', ['Greenwood Residency']);
            societyId = existing.rows[0].id;
            console.log(`⏭️  Demo society already exists (ID: ${societyId})\n`);
        }

        // 2. Create Admin User
        console.log('👤 Creating admin user...');
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        await pool.query(`
            INSERT INTO users (society_id, name, email, phone, role, block, flat_number, password_hash, is_super_admin, is_first_login, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            ON CONFLICT (email) DO NOTHING
        `, [
            societyId,
            'Admin User',
            'admin@greenwood.com',
            '+919876543210',
            'admin',
            'A',
            '101',
            adminPasswordHash,
            false,
            false
        ]);
        console.log('✅ Admin user created (Email: admin@greenwood.com, Password: admin123)\n');

        // 3. Create Sample Residents
        console.log('👥 Creating sample residents...');
        const residents = [
            ['Rajesh Kumar', 'rajesh@example.com', '+919876543211', 'A', '102'],
            ['Priya Sharma', 'priya@example.com', '+919876543212', 'A', '103'],
            ['Amit Patel', 'amit@example.com', '+919876543213', 'B', '201'],
            ['Sneha Reddy', 'sneha@example.com', '+919876543214', 'B', '202'],
            ['Vikram Singh', 'vikram@example.com', '+919876543215', 'C', '301']
        ];

        for (const [name, email, phone, block, flat] of residents) {
            const passwordHash = await bcrypt.hash('password123', 10);
            await pool.query(`
                INSERT INTO users (society_id, name, email, phone, role, block, flat_number, password_hash, is_first_login, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                ON CONFLICT (email) DO NOTHING
            `, [societyId, name, email, phone, 'resident', block, flat, passwordHash, false]);
        }
        console.log(`✅ ${residents.length} residents created\n`);

        // 4. Create Guard User
        console.log('🛡️  Creating guard user...');
        const guardPasswordHash = await bcrypt.hash('guard123', 10);
        await pool.query(`
            INSERT INTO users (society_id, name, email, phone, role, password_hash, is_first_login, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (email) DO NOTHING
        `, [
            societyId,
            'Security Guard',
            'guard@greenwood.com',
            '+919876543220',
            'guard',
            guardPasswordHash,
            false
        ]);
        console.log('✅ Guard user created (Email: guard@greenwood.com, Password: guard123)\n');

        // 5. Create Sample Announcement
        console.log('📢 Creating sample announcement...');
        await pool.query(`
            INSERT INTO announcements (society_id, title, message, type, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT DO NOTHING
        `, [
            societyId,
            'Welcome to Greenwood Residency!',
            'This is a demo society management system. Explore all the features!',
            'general'
        ]);
        console.log('✅ Sample announcement created\n');

        // 6. Create Sample Maintenance Bills
        console.log('💰 Creating sample maintenance bills...');
        const billFlats = ['101', '102', '103', '201', '202', '301'];
        for (const flat of billFlats) {
            await pool.query(`
                INSERT INTO maintenance_bills (society_id, flat_number, amount, due_date, status, month, created_at)
                VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', $4, $5, NOW())
                ON CONFLICT DO NOTHING
            `, [
                societyId,
                flat,
                5000,
                'pending',
                'January 2026'
            ]);
        }
        console.log(`✅ ${billFlats.length} sample bills created\n`);

        // 7. Create Sample Parking Slots
        console.log('🚗 Creating sample parking slots...');
        const parkingSlots = ['A-1', 'A-2', 'A-3', 'B-1', 'B-2', 'C-1'];
        for (const slot of parkingSlots) {
            await pool.query(`
                INSERT INTO parking_slots (society_id, slot_number, type, created_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT DO NOTHING
            `, [societyId, slot, 'resident']);
        }
        console.log(`✅ ${parkingSlots.length} parking slots created\n`);

        console.log('🎉 Database seeding completed successfully!\n');
        console.log('═══════════════════════════════════════════');
        console.log('📋 DEMO LOGIN CREDENTIALS:');
        console.log('═══════════════════════════════════════════');
        console.log('👤 Admin:');
        console.log('   Email: admin@greenwood.com');
        console.log('   Password: admin123');
        console.log('');
        console.log('👥 Resident (any of these):');
        console.log('   Email: rajesh@example.com');
        console.log('   Password: password123');
        console.log('');
        console.log('🛡️  Guard:');
        console.log('   Email: guard@greenwood.com');
        console.log('   Password: guard123');
        console.log('═══════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run seeding
seedDatabase();
