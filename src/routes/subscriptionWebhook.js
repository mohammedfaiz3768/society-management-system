const express = require("express");
const router = express.Router();
const db = require("../config/db");
const crypto = require("crypto");

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body.toString())
    .digest("hex");

  const receivedSignature = req.headers["x-razorpay-signature"];

  if (expectedSignature !== receivedSignature) {
    console.log("Invalid webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body);

  if (event.event === "subscription.charged") {
    const sub = event.payload.subscription.entity;

    await db.query(
      `UPDATE user_subscriptions
       SET status = $1, start_at = NOW()
       WHERE razorpay_subscription_id = $2`,
      ["active", sub.id]
    );

    console.log("Subscription charged:", sub.id);
  }

  res.json({ success: true });
});

module.exports = router;
