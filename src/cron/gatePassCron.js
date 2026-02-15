const cron = require("node-cron");
const pool = require("../config/db");

cron.schedule("0 0 * * *", async () => {
  try {
    const expireResult = await pool.query(
      `UPDATE gate_passes 
       SET status = 'EXPIRED' 
       WHERE status = 'PENDING' AND valid_until < NOW()`
    );
    console.log(`GatePass CRON: Expired ${expireResult.rowCount} passes.`);

    const deleteResult = await pool.query(
      `DELETE FROM gate_passes 
       WHERE valid_until < NOW() - INTERVAL '24 hours'`
    );
    console.log(`GatePass CRON: Deleted ${deleteResult.rowCount} old expired passes.`);
  } catch (err) {
    console.error("GatePass CRON error:", err);
  }
});

console.log("GatePass CRON loaded...");
