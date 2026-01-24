const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkTables() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('Tables found:');
        res.rows.forEach(r => console.log(`- ${r.table_name}`));
        client.release();
    } catch (err) {
        console.error('Error checking tables:', err);
    } finally {
        pool.end();
    }
}

checkTables();
