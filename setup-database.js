/**
 * Simple Database Setup Script
 * Runs base schema setup
 */

const { Pool } = require('pg');
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

        console.log('\n🎉 Database setup completed successfully!\n');
        console.log('═══════════════════════════════════════════');
        console.log('📋 Database is ready for use');
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
