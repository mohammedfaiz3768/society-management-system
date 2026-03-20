const cron = require("node-cron");
const pool = require("../config/db");

cron.schedule("0 0 1 * *", async () => {
  const monthYear = new Date().toISOString().slice(0, 7);
  console.log(`[invoiceCron] Starting invoice generation for ${monthYear}...`);

  try {
    const result = await pool.query(
      `INSERT INTO invoices (user_id, society_id, amount, month_year, status)
             SELECT 
                u.id,
                u.society_id,
                f.maintenance_charge,
                $1,
                'PENDING'
             FROM users u
             -- ✅ Society-scoped JOIN — prevents flat number collision across societies
             JOIN flats f 
                ON u.flat_number = f.flat_number 
               AND f.society_id = u.society_id
             -- ✅ Only bill active societies — skip trial/cancelled
             JOIN societies s 
                ON u.society_id = s.id
               AND s.status = 'active'
             WHERE u.role = 'resident'
               AND u.society_id IS NOT NULL
               -- ✅ Skip flats with no maintenance charge set
               AND f.maintenance_charge IS NOT NULL
               AND f.maintenance_charge > 0
             -- ✅ Requires UNIQUE constraint on (user_id, month_year) in DB
             ON CONFLICT (user_id, month_year) DO NOTHING`,
      [monthYear]
    );

    console.log(`[invoiceCron] Done — ${result.rowCount} invoices generated for ${monthYear}`);

  } catch (err) {
    console.error(`[invoiceCron] FAILED for ${monthYear}:`, err);
  }

}, { timezone: "Asia/Kolkata" });

console.log("[invoiceCron] Loaded — scheduled for 1st of every month at midnight IST");
