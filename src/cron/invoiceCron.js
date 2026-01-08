const cron = require("node-cron");
const pool = require("../config/db");

cron.schedule("0 0 1 * *", async () => {
  try {
    const monthYear = new Date().toISOString().slice(0, 7);

    await pool.query(
      `INSERT INTO invoices (user_id, amount, month_year, status)
       SELECT u.id, f.maintenance_charge, $1, 'PENDING'
       FROM users u
       JOIN flats f ON u.flat_number = f.flat_number
       WHERE u.role = 'resident'
       ON CONFLICT DO NOTHING`,
      [monthYear]
    );

    console.log("Monthly maintenance invoices generated.");
  } catch (err) {
    console.error("Invoice generation error:", err);
  }
});

console.log("Invoice CRON loaded...");
