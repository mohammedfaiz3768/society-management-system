const nodemailer = require("nodemailer");
const { shouldSkipEmail, sendDemoNotification } = require("../middleware/demoMode");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendEmail = async ({ to, subject, html }) => {
    // Check if we should skip real email in demo mode
    if (shouldSkipEmail()) {
        sendDemoNotification('email', to, { subject, html });
        return true; // Return success in demo mode
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        });
        console.log("Email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Email Error:", error);
        // In production, you might want to throw error or handle it differently
        // For now, logging it is enough
        return false;
    }
};
