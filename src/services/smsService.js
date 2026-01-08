const axios = require("axios");
const { shouldSkipSMS, sendDemoNotification } = require("../middleware/demoMode");

async function sendSMS(phone, message) {
  // Check if we should skip real SMS in demo mode
  if (shouldSkipSMS()) {
    sendDemoNotification('sms', phone, { message });
    return true; // Return success in demo mode
  }

  try {
    const apiKey = process.env.SMS_API_KEY;   // your SMS provider API key
    const sender = process.env.SMS_SENDER || "SOCIETY";

    // Example: Fast2SMS (can be swapped to any provider)
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "v3",
        sender_id: sender,
        message: message,
        language: "english",
        numbers: phone,
      },
      {
        headers: {
          authorization: apiKey,
        },
      }
    );

    console.log("SMS sent:", response.data);
    return true;

  } catch (err) {
    console.error("SMS sending failed:", err.response?.data || err);
    return false;
  }
}

module.exports = { sendSMS };
