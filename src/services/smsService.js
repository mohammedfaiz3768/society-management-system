const axios = require("axios");

if (!process.env.SMS_API_KEY) {
  console.warn("[smsService] SMS_API_KEY not set — SMS will be disabled");
}

async function sendSMS(phone, message) {
  const apiKey = process.env.SMS_API_KEY;
  const sender = process.env.SMS_SENDER || "SOCIETY";

  if (!apiKey) {
    console.warn("[smsService] Skipped — SMS_API_KEY not configured");
    return false;
  }

  if (!phone || !/^[0-9]{10}$/.test(String(phone))) {
    console.warn(`[smsService] Invalid phone number: ${phone}`);
    return false;
  }

  if (!message || message.length > 160) {
    console.warn("[smsService] Skipped — message empty or exceeds 160 characters");
    return false;
  }

  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "v3",
        sender_id: sender,
        message,
        language: "english",
        numbers: phone,
      },
      {
        headers: { authorization: apiKey },
      }
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(`[smsService] Sent to ${phone}`);
    }

    return true;

  } catch (err) {
    console.error("[smsService] Failed:", err.response?.data || err.message);
    return false;
  }
}

module.exports = { sendSMS };
