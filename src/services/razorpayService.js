const crypto = require("crypto");
const { razorpay, isInitialized } = require("../config/razorpay");

exports.createOrder = async (amount, receipt) => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
  }

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const safeReceipt = receipt?.toString().slice(0, 40); // ✅ Razorpay 40 char limit

  return await razorpay.orders.create({
    amount: Math.round(amount * 100), // ✅ Math.round prevents float precision errors
    currency: "INR",
    receipt: safeReceipt,
  });
};

exports.verifyPayment = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay secret not configured");
  }

  if (!orderId || !paymentId || !signature) {
    return false; // ✅ fail safely on missing input
  }

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    // ✅ timing-safe comparison — prevents timing attack signature guessing
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false; // ✅ malformed signature never crashes the server
  }
};

exports.refundPayment = async (paymentId, amount) => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
  }

  if (!paymentId) {
    throw new Error("Payment ID is required for refund");
  }

  return await razorpay.payments.refund(paymentId, {
    amount: Math.round(amount * 100), // ✅ Math.round
  });
};

exports.createPlan = async (amount, period = "monthly") => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
  }

  const validPeriods = ["daily", "weekly", "monthly", "yearly"];
  if (!validPeriods.includes(period)) {
    throw new Error(`Invalid period. Must be one of: ${validPeriods.join(", ")}`);
  }

  return await razorpay.plans.create({
    period,
    interval: 1,
    item: {
      name: `Maintenance Plan (${period})`,
      amount: Math.round(amount * 100), // ✅ Math.round
      currency: "INR",
    },
  });
};

exports.createSubscription = async (planId) => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
  }

  if (!planId) {
    throw new Error("Plan ID is required");
  }

  return await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 12,
    quantity: 1,
    customer_notify: 1,
  });
};

exports.cancelSubscription = async (subscriptionId) => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
  }

  if (!subscriptionId) {
    throw new Error("Subscription ID is required");
  }

  return await razorpay.subscriptions.cancel(subscriptionId);
};