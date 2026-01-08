/**
 * Simple Database Setup Script
 * Runs base schema and seeds demo data in one step
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function setupDatabase() {
    console.log('🚀 Starting database setup...\n');

    try {
        // Test connection
        const testResult = await pool.query('SELECT NOW()');
        console.log('✅ Connected to database at:', testResult.rows[0].now);
        console.log('');

        // Create base schema
        console.log('📄 Creating base schema...');
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'migrations', '00_base_schema.sql'), 'utf-8');
        await pool.query(schemaSQL);
        console.log('✅ Base schema created\n');

        // Seed demo data
        console.log('🌱 Seeding demo data...\n');

        // 1. Create Demo Society
        console.log('  📍 Creating demo society...');
        const societyResult = await pool.query(`
            INSERT INTO societies (name, address, city, state, pincode, total_units, status, subscription_plan)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
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

        const societyId = societyResult.rows[0].id;
        console.log(`     Society ID: ${societyId}`);

        // 2. Create Admin User
        console.log('  👤 Creating admin user...');
        const adminHash = await bcrypt.hash('admin123', 10);
        await pool.query(`
            INSERT INTO users (society_id, name, email, phone, role, block, flat_number, password_hash, is_super_admin, is_first_login)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (email) DO NOTHING
        `, [societyId, 'Admin User', 'admin@greenwood.com', '+919876543210', 'admin', 'A', '101', adminHash, false, false]);

        // 3. Create Sample Residents
        console.log('  👥 Creating sample residents...');
        const residents = [
            ['Rajesh Kumar', 'rajesh@example.com', '+919876543211', 'A', '102'],
            ['Priya Sharma', 'priya@example.com', '+919876543212', 'A', '103'],
            ['Amit Patel', 'amit@example.com', '+919876543213', 'B', '201']
        ];

        for (const [name, email, phone, block, flat] of residents) {
            const hash = await bcrypt.hash('password123', 10);
            await pool.query(`
                INSERT INTO users (society_id, name, email, phone, role, block, flat_number, password_hash, is_first_login)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (email) DO NOTHING
            `, [societyId, name, email, phone, 'resident', block, flat, hash, false]);
        }

        // 4. Create Guard
        console.log('  🛡️  Creating guard user...');
        const guardHash = await bcrypt.hash('guard123', 10);
        await pool.query(`
            INSERT INTO users (society_id, name, email, phone, role, password_hash, is_first_login)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (email) DO NOTHING
        `, [societyId, 'Security Guard', 'guard@greenwood.com', '+919876543220', 'guard', guardHash, false]);

        // 5. Sample Announcement
        console.log('  📢 Creating announcement...');
        await pool.query(`
            INSERT INTO announcements (society_id, title, message, type)
            VALUES ($1, $2, $3, $4)
        `, [societyId, 'Welcome to Greenwood Residency!', 'This is a demo society. Explore all features!', 'general']);

        console.log('\n🎉 Database setup completed successfully!\n');
        console.log('═══════════════════════════════════════════');
        console.log('📋 DEMO LOGIN CREDENTIALS:');
        console.log('═══════════════════════════════════════════');
        console.log('👤 Admin:');
        console.log('   Email: admin@greenwood.com');
        console.log('   Password: admin123');
        console.log('');
        console.log('👥 Resident:');
        console.log('   Email: rajesh@example.com');
        console.log('   Password: password123');
        console.log('');
        console.log('🛡️  Guard:');
        console.log('   Email: guard@greenwood.com');
        console.log('   Password: guard123');
        console.log('═══════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Setup failed:');
        console.error('Error:', error.message);
        if (error.code) console.error('Code:', error.code);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupDatabase();
