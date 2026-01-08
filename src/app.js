const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());

const razorpayWebhook = require("./routes/razorpayWebhook");
app.use(
    "/api/razorpay/webhook",
    express.raw({ type: "application/json" })
);

app.use(express.json());
app.use(cors({ origin: "*" }));

// Import middlewares
const societyMiddleware = require("./middleware/societyMiddleware");

app.get("/", (req, res) => {
    res.json({ message: "Society backend running" });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Auth routes (no society filtering needed)
app.use("/api/auth", require("./modules/auth"));

// Apply society middleware to all protected routes
app.use("/api/users", societyMiddleware, require("./modules/users"));
app.use("/api/flats", societyMiddleware, require("./modules/flat"));
app.use("/api/societies", require("./modules/societies")); // Has own auth checks
app.use("/api/notices", societyMiddleware, require("./modules/notices"));
app.use("/api/gate-pass", societyMiddleware, require("./modules/gatepass"));
app.use("/api/visitors", societyMiddleware, require("./modules/visitors"));
app.use("/api/delivery", societyMiddleware, require("./modules/delivery"));
app.use("/api/staff", societyMiddleware, require("./modules/staff"));
app.use("/api/complaints", societyMiddleware, require("./modules/complaints"));
app.use("/api/maintenance", societyMiddleware, require("./modules/maintenance"));
app.use("/api/payments", societyMiddleware, require("./modules/payments"));
app.use("/api/polls", societyMiddleware, require("./modules/polls"));
app.use("/api/announcements", societyMiddleware, require("./modules/announcements"));
app.use("/api/directory", societyMiddleware, require("./modules/directory"));
app.use("/api/parking", societyMiddleware, require("./modules/parking"));
app.use("/api/sos", societyMiddleware, require("./modules/sos"));
app.use("/api/emergency-alerts", societyMiddleware, require("./modules/emergency-alerts"));
app.use("/api/documents", societyMiddleware, require("./modules/documents"));
app.use("/api/timeline", societyMiddleware, require("./modules/timeline"));
app.use("/api/dashboard", societyMiddleware, require("./modules/dashboard"));
app.use("/api/invitations", require("./modules/invitations/invitationRoutes")); // Skip for now

// Feature flag enabled routes
// app.use("/api/cctv", require("./hidden/cctv/cctvRoutes"));
// app.use("/api/ai", require("./hidden/ai/aiDashboardRoutes"));
// app.use("/api/chat", require("./hidden/chat/chatRoutes"));


app.use("/api/notifications", require("./hidden/notifications/notificationRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/registration", require("./modules/registration/registrationRoutes"));

app.use("/api/razorpay/webhook", razorpayWebhook);

module.exports = app;
