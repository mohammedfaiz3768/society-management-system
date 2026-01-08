const Razorpay = require("../../config/razorpay");
const crypto = require("crypto");
const db = require("../../config/db");

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    const societyId = req.societyId;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await Razorpay.orders.create(options);

    await db.query(
      `INSERT INTO payments (user_id, order_id, amount, currency, society_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, order.id, amount * 100, "INR", societyId]
    );

    return res.json({ order });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ error: "Could not create order" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const societyId = req.societyId;
    const {
      order_id,
      payment_id,
      signature
    } = req.body;

    const body = order_id + "|" + payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    await db.query(
      `UPDATE payments
       SET payment_id=$1, status='SUCCESS', updated_at=NOW()
       WHERE order_id=$2 AND society_id=$3`,
      [payment_id, order_id, societyId]
    );

    return res.json({ success: true, message: "Payment verified successfully" });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
};
