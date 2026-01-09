const crypto = require("crypto");
const { razorpay, isInitialized } = require("../config/razorpay");

exports.createOrder = async (amount, receipt) => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
  }

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: receipt,
  };
  return await razorpay.orders.create(options);
};

exports.verifyPayment = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay secret not configured");
  }

  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest("hex");
  return generatedSignature === signature;
};

exports.refundPayment = async (paymentId, amount) => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
  }

  return await razorpay.payments.refund(paymentId, { amount: amount * 100 });
};

exports.createPlan = async (amount, period = "monthly") => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
  }

  return await razorpay.plans.create({
    period: period,
    interval: 1,
    item: {
      name: `Maintenance Plan (${period})`,
      amount: amount * 100,
      currency: "INR",
    },
  });
};

exports.createSubscription = async (planId) => {
  if (!isInitialized || !razorpay) {
    throw new Error("Razorpay is not configured");
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

  return await razorpay.subscriptions.cancel(subscriptionId);
};
