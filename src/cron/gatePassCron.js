const cron = require("node-cron");
const pool = require("../config/db");

// Runs every day at midnight IST
cron.schedule("0 0 * * *", async () => {
  console.log("[gatePassCron] Starting daily gate pass cleanup...");

  const client = await pool.connect(); // ✅ transaction — both or neither

  try {
    await client.query("BEGIN");

    // Step 1 — expire all pending passes past their valid_until
    const expireResult = await client.query(
      `UPDATE gate_passes
             SET status = 'EXPIRED'
             WHERE status = 'PENDING'
               AND valid_until < NOW()`
    );
    console.log(`[gatePassCron] Expired ${expireResult.rowCount} passes`);

    // Step 2 — delete only EXPIRED passes older than 24 hours
    // ✅ USED/ACTIVE passes are not touched — audit trail preserved
    const deleteResult = await client.query(
      `DELETE FROM gate_passes
             WHERE status = 'EXPIRED'
               AND valid_until < NOW() - INTERVAL '24 hours'`
    );
    console.log(`[gatePassCron] Deleted ${deleteResult.rowCount} old expired passes`);

    await client.query("COMMIT");
    console.log("[gatePassCron] Done");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[gatePassCron] FAILED — rolled back:", err);
    // ✅ TODO: Alert admin when cleanup cron fails
    // await sendEmail(process.env.ADMIN_EMAIL, "GatePass Cron Failed", err.message);

  } finally {
    client.release(); // ✅ always release connection back to pool
  }

}, { timezone: "Asia/Kolkata" }); // ✅ explicit timezone

console.log("[gatePassCron] Loaded — scheduled daily at midnight IST");