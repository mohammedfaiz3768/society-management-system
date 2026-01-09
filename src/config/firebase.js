const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Try to load service account from file, fallback to environment variable
const serviceAccountPath = path.join(__dirname, "../../firebase-service-account.json");
let firebaseInitialized = false;

try {
  if (fs.existsSync(serviceAccountPath)) {
    // Use service account file if available
    const serviceAccount = require("../../firebase-service-account.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log("✅ Firebase initialized with service account file");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Use environment variable (JSON string)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log("✅ Firebase initialized with environment variable");
  } else {
    console.warn("⚠️  Firebase not configured - push notifications will be disabled");
  }
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message);
  console.warn("⚠️  Continuing without Firebase - push notifications will be disabled");
}

module.exports = {
  admin: firebaseInitialized ? admin : null,
  isInitialized: firebaseInitialized
};
