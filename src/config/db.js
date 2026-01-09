const { Pool } = require("pg");
require("dotenv").config();

// Use DATABASE_URL if available, otherwise use individual connection params
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      // Add SSL configuration for Neon PostgreSQL
      ssl: process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech') ? {
        rejectUnauthorized: false
      } : false
    }
);

pool.on("connect", () => {
  console.log("Database connected successfully!");
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

module.exports = pool;
