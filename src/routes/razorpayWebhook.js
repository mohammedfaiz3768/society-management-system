const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../config/db");

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const body = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      console.log("Webhook signature invalid");
      return res.status(400).send("Invalid signature");
    }

    const event = body.event;

    if (event === "payment.captured") {
      const payment = body.payload.payment.entity;

      await db.query(
        `UPDATE payments 
         SET payment_id = $1, status = 'PAID', paid_at = NOW()
         WHERE order_id = $2`,
        [payment.id, payment.order_id]
      );

      console.log("Payment captured:", payment.id);
    }

    if (event === "payment.failed") {
      const payment = body.payload.payment.entity;

      await db.query(
        `UPDATE payments 
         SET status = 'FAILED', updated_at = NOW()
         WHERE order_id = $1`,
        [payment.order_id]
      );

      console.log("Payment failed:", payment.id);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
