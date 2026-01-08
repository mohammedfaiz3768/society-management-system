const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (amount, receipt) => {
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: receipt,
  };
  return await razorpay.orders.create(options);
};

exports.verifyPayment = (orderId, paymentId, signature) => {
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest("hex");
  return generatedSignature === signature;
};

exports.refundPayment = async (paymentId, amount) => {
  return await razorpay.payments.refund(paymentId, { amount: amount * 100 });
};

exports.createPlan = async (amount, period = "monthly") => {
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
  return await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 12,
    quantity: 1,
    customer_notify: 1,
  });
};

exports.cancelSubscription = async (subscriptionId) => {
  return await razorpay.subscriptions.cancel(subscriptionId);
};
