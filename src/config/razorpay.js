const Razorpay = require("razorpay");

let razorpayInstance = null;
let isInitialized = false;

// Only initialize Razorpay if credentials are provided
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    isInitialized = true;
    console.log("✅ Razorpay initialized for payments");
  } catch (error) {
    console.error("❌ Razorpay initialization failed:", error.message);
    console.warn("⚠️  Continuing without Razorpay - payments will be disabled");
  }
} else {
  console.warn("⚠️  Razorpay not configured - payments will be disabled");
}

module.exports = {
  razorpay: razorpayInstance,
  isInitialized
};
