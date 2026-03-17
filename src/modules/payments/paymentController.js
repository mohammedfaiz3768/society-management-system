const crypto = require("crypto");
const db = require("../../config/db");
const razorpayService = require("../../services/razorpayService"); // ✅ always use service

exports.createOrder = async (req, res) => {
  try {
    const { bill_id } = req.body;
    const userId = req.user.id;
    const societyId = req.societyId;

    if (!bill_id) {
      return res.status(400).json({ error: "bill_id is required" });
    }

    // ✅ Fetch actual bill amount from DB — never trust client-sent amount
    const billResult = await db.query(
      `SELECT amount FROM maintenance_bills
             WHERE id = $1 AND user_id = $2 AND society_id = $3 AND status = 'PENDING'`,
      [bill_id, userId, societyId]
    );

    if (!billResult.rows.length) {
      return res.status(404).json({ error: "Pending bill not found" });
    }

    const amount = billResult.rows[0].amount;

    // ✅ Check for existing pending order — prevent double payments
    const existing = await db.query(
      `SELECT order_id FROM payments
             WHERE user_id = $1 AND bill_id = $2 AND status = 'PENDING'`,
      [userId, bill_id]
    );

    if (existing.rows.length > 0) {
      return res.json({ order_id: existing.rows[0].order_id });
    }

    // ✅ Use service — includes Math.round, receipt cap, isInitialized guard
    const receipt = `rcpt_${userId}_${Date.now()}`;
    const order = await razorpayService.createOrder(amount, receipt);

    await db.query(
      `INSERT INTO payments (user_id, bill_id, order_id, amount, currency, status, society_id)
             VALUES ($1, $2, $3, $4, 'INR', 'PENDING', $5)`,
      [userId, bill_id, order.id, order.amount, societyId]
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
    const { order_id, payment_id, signature } = req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({ success: false, message: "order_id, payment_id and signature are required" });
    }

    // ✅ Verify order exists in our DB first — prevent forged orders
    const paymentRow = await db.query(
      `SELECT * FROM payments WHERE order_id = $1 AND society_id = $2`,
      [order_id, societyId]
    );

    if (!paymentRow.rows.length) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ✅ Prevent double processing
    if (paymentRow.rows[0].status === "SUCCESS") {
      return res.json({ success: true, message: "Payment already verified" });
    }

    // ✅ Use service — includes timingSafeEqual, input validation
    const isValid = razorpayService.verifyPayment(order_id, payment_id, signature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // ✅ Update payment AND the bill in a transaction — both or neither
    await db.query("BEGIN");
    try {
      await db.query(
        `UPDATE payments
                 SET payment_id = $1, status = 'SUCCESS', updated_at = NOW()
                 WHERE order_id = $2 AND society_id = $3`,
        [payment_id, order_id, societyId]
      );

      await db.query(
        `UPDATE maintenance_bills
                 SET status = 'PAID', paid_at = NOW()
                 WHERE id = $1 AND society_id = $2`,
        [paymentRow.rows[0].bill_id, societyId]
      );

      await db.query("COMMIT");
    } catch (txErr) {
      await db.query("ROLLBACK");
      throw txErr;
    }

    return res.json({ success: true, message: "Payment verified successfully" });

  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
};