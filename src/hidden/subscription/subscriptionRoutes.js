const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const db = require("../../config/db");
const {
  createPlan,
  createSubscription,
  cancelSubscription,
} = require("../../services/razorpayService");

router.post("/create-plan", auth, async (req, res) => {
  try {
    const { amount, period } = req.body;

    const plan = await createPlan(amount, period);

    await db.query(
      `INSERT INTO payment_plans (razorpay_plan_id, period, interval, amount, title)
       VALUES ($1, $2, 1, $3, $4)`,
      [plan.id, period, amount, `Maintenance ${period} plan`]
    );

    res.json(plan);
  } catch (err) {
    console.error("Create plan error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/create-subscription", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    const planRecord = await db.query(
      `SELECT * FROM payment_plans WHERE id=$1`,
      [planId]
    );

    if (!planRecord.rowCount)
      return res.status(404).json({ error: "Plan not found" });

    const subscription = await createSubscription(planRecord.rows[0].razorpay_plan_id);

    await db.query(
      `INSERT INTO user_subscriptions
       (user_id, razorpay_subscription_id, plan_id, status)
       VALUES ($1, $2, $3, $4)`,
      [userId, subscription.id, planId, subscription.status]
    );

    res.json(subscription);
  } catch (err) {
    console.error("Create subscription error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cancel", auth, async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const result = await cancelSubscription(subscriptionId);

    await db.query(
      `UPDATE user_subscriptions 
       SET status=$1, end_at=NOW() 
       WHERE razorpay_subscription_id=$2`,
      ["cancelled", subscriptionId]
    );

    res.json(result);
  } catch (err) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
