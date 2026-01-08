const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const db = require("../../config/db");

const {
  createOrder,
  verifyPayment,
  refundPayment,
  createPlan,
  createSubscription,
  cancelSubscription
} = require("../../services/razorpayService");

router.post("/create-order", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, purpose } = req.body;

    const receiptId = "rcpt_" + Date.now();
    const order = await createOrder(amount, receiptId);

    await db.query(
      `INSERT INTO payments (user_id, order_id, amount, purpose)
       VALUES ($1, $2, $3, $4)`,
      [userId, order.id, amount, purpose]
    );

    res.json({ order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, paymentId, signature } = req.body;

    const isValid = verifyPayment(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    await db.query(
      `UPDATE payments 
       SET payment_id=$1, status='PAID', paid_at=NOW()
       WHERE order_id=$2`,
      [paymentId, orderId]
    );

    const currentMonth = new Date().toISOString().slice(0, 7);

    await db.query(
      `UPDATE invoices 
       SET status='PAID', paid_at=NOW()
       WHERE user_id=$1 AND month_year=$2`,
      [userId, currentMonth]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Payment verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/refund", auth, async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    const adminId = req.user.id;

    const refund = await refundPayment(paymentId, amount);

    await db.query(
      `INSERT INTO refunds (payment_id, refund_id, amount, user_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [paymentId, refund.id, amount, adminId, reason]
    );

    await db.query(
      `UPDATE payments SET status='REFUNDED' WHERE payment_id=$1`,
      [paymentId]
    );

    res.json({ success: true, refund });
  } catch (err) {
    console.error("Refund error:", err);
    res.status(500).json({ error: "Could not process refund" });
  }
});

router.get("/history", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT * FROM payments
       WHERE user_id=$1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/create-plan", auth, async (req, res) => {
  try {
    const { amount, period } = req.body;

    const plan = await createPlan(amount, period || "monthly");

    await db.query(
      `INSERT INTO plans (plan_id, amount, period)
       VALUES ($1, $2, $3)`,
      [plan.id, amount, period || "monthly"]
    );

    res.json({ success: true, plan });
  } catch (err) {
    console.error("Create Plan error:", err);
    res.status(500).json({ error: "Could not create plan" });
  }
});

router.post("/create-subscription", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_id } = req.body;

    const subscription = await createSubscription(plan_id);

    await db.query(
      `INSERT INTO subscriptions (user_id, subscription_id, plan_id, status)
       VALUES ($1, $2, $3, $4)`,
      [userId, subscription.id, plan_id, subscription.status]
    );

    res.json({ success: true, subscription });
  } catch (err) {
    console.error("Create subscription error:", err);
    res.status(500).json({ error: "Could not create subscription" });
  }
});

router.post("/cancel-subscription", auth, async (req, res) => {
  try {
    const { subscription_id } = req.body;

    const cancelled = await cancelSubscription(subscription_id);

    await db.query(
      `UPDATE subscriptions SET status='cancelled'
       WHERE subscription_id=$1`,
      [subscription_id]
    );

    res.json({ success: true, cancelled });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ error: "Could not cancel subscription" });
  }
});

router.post("/create-plan/basic", auth, async (req, res) => {
  try {
    const plan = await createPlan(599, "monthly");
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ error: "Cannot create basic plan" });
  }
});

router.post("/create-plan/premium", auth, async (req, res) => {
  try {
    const plan = await createPlan(799, "monthly");
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ error: "Cannot create premium plan" });
  }
});

router.post("/create-plan/yearly", auth, async (req, res) => {
  try {
    const plan = await createPlan(5999, "yearly");
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ error: "Cannot create yearly plan" });
  }
});

module.exports = router;
