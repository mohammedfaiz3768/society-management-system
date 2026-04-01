/**
 * Database Migration Runner
 * Runs all SQL migrations in order to set up the database schema
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create connection pool using DATABASE_URL which includes SSL configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Migration files in order (base schema must run first)
const migrations = [
    '00_base_schema.sql',          // Creates all base tables
    '01_add_notifications_table.sql', // Adds notifications table
    '04_add_missing_tables.sql',    // flat_members, visitor_parking, service_requests
    'add_multi_tenant_schema.sql',  // Adds columns (will skip if exists)
    'add_society_registration.sql', // Adds registration fields
    'add_email_to_otp_codes.sql',  // Adds email to OTP
    'create_invitations_table.sql', // Creates invitations (will skip if exists)
    'create_gate_passes_table.sql', // Creates gate passes (will skip if exists)
    'add_sos_enhancements.sql',     // SOS enhancements
    '02_add_number_of_people_to_gate_passes.sql', // Gate pass people count
    '03_fix_polls_schema.sql',      // Polls schema fixes
];

async function runMigrations() {
    console.log('🔄 Starting database migrations...\n');

    try {
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connection successful!');
        const result = await client.query('SELECT NOW()');
        console.log(`   Connected at: ${result.rows[0].now}\n`);
        client.release();

        // Run each migration
        for (const migrationFile of migrations) {
            const filePath = path.join(__dirname, 'migrations', migrationFile);

            console.log(`📄 Running migration: ${migrationFile}...`);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Warning: ${migrationFile} not found, skipping...\n`);
                continue;
            }

            const sql = fs.readFileSync(filePath, 'utf-8');

            try {
                await pool.query(sql);
                console.log(`✅ ${migrationFile} completed\n`);
            } catch (error) {
                // If error is "already exists", it's okay (migration already ran)
                if (error.message.includes('already exists') || error.code === '42P07') {
                    console.log(`⏭️  ${migrationFile} already applied (skipped)\n`);
                } else {
                    console.error(`❌ Error in ${migrationFile}:`, error.message);
                    throw error;
                }
            }
        }

        console.log('🎉 All migrations completed successfully!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migrations
runMigrations();
