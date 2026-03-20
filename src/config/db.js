const { Pool } = require("pg");


if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  console.error("[DB] No database configuration found. Set DATABASE_URL or DB_HOST in .env");
  process.exit(1);
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
    : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_HOST?.includes("neon.tech")
        ? { rejectUnauthorized: true }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
);

pool.query("SELECT NOW()")
  .then(() => console.log("[DB] Connected successfully"))
  .catch(err => {
    console.error("[DB] Connection failed at startup:", err.message);
    process.exit(1);
  });

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

module.exports = pool;
