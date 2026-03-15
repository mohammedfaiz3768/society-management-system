const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendEmail = async (to, subject, text, html = null) => {
    try {
        await transporter.sendMail({
            from: `"UNIFY App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,          
            html: html || `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color:#2c7be5;">Your Login OTP</h2>

                    <p style="font-size: 16px;">
                        Your OTP for logging into <strong>UNIFY</strong> is:
                    </p>

                    <div style="
                        font-size: 32px;
                        font-weight: bold;
                        margin: 20px 0;
                        color: #2c7be5;
                    ">
                        ${text}
                    </div>

                    <p style="color: #666;">This OTP will expire in 5 minutes.</p>

                    <hr style="margin: 30px 0;"/>

                    <p style="font-size: 13px; color: #999;">
                        If you did not request this code, please ignore this email.
                    </p>
                </div>
            `,
        });

        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error("sendEmail error:", error);
    }
};
