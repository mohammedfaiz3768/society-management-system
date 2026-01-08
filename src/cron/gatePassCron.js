const cron = require("node-cron");
const pool = require("../config/db");

cron.schedule("0 0 * * *", async () => {
  try {
    const result = await pool.query(
      `UPDATE gate_passes 
       SET status = 'EXPIRED' 
       WHERE status = 'PENDING' AND valid_until < NOW()`
    );

    console.log(`GatePass CRON: Expired ${result.rowCount} passes.`);
  } catch (err) {
    console.error("GatePass CRON error:", err);
  }
});

console.log("GatePass CRON loaded...");
