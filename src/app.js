const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));

const razorpayWebhook = require("./routes/razorpayWebhook");
app.use(
    "/api/razorpay/webhook",
    express.raw({ type: "application/json" }),
    razorpayWebhook
);

app.use(express.json());

const authMiddleware = require("./middleware/authMiddleware");
const societyMiddleware = require("./middleware/societyMiddleware");

app.get("/", (req, res) => {
    res.json({ message: "Society backend running" });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./modules/auth"));
app.use("/api/societies", require("./modules/societies"));
app.use("/api/invitations", require("./modules/invitations/invitationRoutes"));
app.use("/api/registration", require("./modules/registration/registrationRoutes"));

app.use("/api/users", authMiddleware, societyMiddleware, require("./modules/users"));
app.use("/api/flats", authMiddleware, societyMiddleware, require("./modules/flat"));
app.use("/api/notices", authMiddleware, societyMiddleware, require("./modules/notices"));
app.use("/api/gate-pass", authMiddleware, societyMiddleware, require("./modules/gatepass"));
app.use("/api/visitors", authMiddleware, societyMiddleware, require("./modules/visitors"));
app.use("/api/delivery", authMiddleware, societyMiddleware, require("./modules/delivery"));
app.use("/api/staff", authMiddleware, societyMiddleware, require("./modules/staff"));
app.use("/api/complaints", authMiddleware, societyMiddleware, require("./modules/complaints"));
app.use("/api/maintenance", authMiddleware, societyMiddleware, require("./modules/maintenance"));
app.use("/api/payments", authMiddleware, societyMiddleware, require("./modules/payments"));
app.use("/api/polls", authMiddleware, societyMiddleware, require("./modules/polls"));
app.use("/api/announcements", authMiddleware, societyMiddleware, require("./modules/announcements"));
app.use("/api/directory", authMiddleware, societyMiddleware, require("./modules/directory"));
app.use("/api/parking", authMiddleware, societyMiddleware, require("./modules/parking"));
app.use("/api/sos", authMiddleware, societyMiddleware, require("./modules/sos"));
app.use("/api/emergency-alerts", authMiddleware, societyMiddleware, require("./modules/emergency-alerts"));
app.use("/api/documents", authMiddleware, societyMiddleware, require("./modules/documents"));
app.use("/api/timeline", authMiddleware, societyMiddleware, require("./modules/timeline"));
app.use("/api/dashboard", authMiddleware, societyMiddleware, require("./modules/dashboard"));
app.use("/api/notifications", authMiddleware, societyMiddleware, require("./routes/notificationRoutes"));

app.use("/api/invoices", authMiddleware, societyMiddleware, require("./routes/invoiceRoutes"));
app.use("/api/services", authMiddleware, societyMiddleware, require("./routes/serviceRoutes"));


app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
