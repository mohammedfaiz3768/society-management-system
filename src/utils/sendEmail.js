const nodemailer = require("nodemailer");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[sendEmail] EMAIL_USER or EMAIL_PASS not set — emails will be disabled");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.sendEmail = async (to, subject, text, html = null) => {
    if (!to || !emailRegex.test(to)) {
        console.warn(`[sendEmail] Skipped — invalid recipient: ${to}`);
        return;
    }

    if (!subject || !text) {
        console.warn("[sendEmail] Skipped — missing subject or text");
        return;
    }

    const safeText = String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    try {
        await transporter.sendMail({
            from: `"UNIFY App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || `
                <div style="font-family:Arial,sans-serif;padding:20px;color:#333;max-width:500px;">
                    <h2 style="color:#1A56DB;">UNIFY</h2>
                    <p style="font-size:16px;line-height:1.6;">${safeText}</p>
                    <hr style="margin:30px 0;border:none;border-top:1px solid #eee;"/>
                    <p style="font-size:13px;color:#999;">
                        If you did not expect this email, please ignore it.
                    </p>
                </div>
            `,
        });

        if (process.env.NODE_ENV !== "production") {
            console.log(`[sendEmail] Sent to ${to}`);
        }

    } catch (error) {
        console.error("[sendEmail] Failed:", error.message);
    }
};
