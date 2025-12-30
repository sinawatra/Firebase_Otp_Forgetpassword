// functions/services/sendOtp.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

// Define secrets
const gmailEmail = defineSecret("GMAIL_EMAIL");
const gmailPassword = defineSecret("GMAIL_PASSWORD");

// Create Nodemailer transporter
async function createTransporter() {
  const email = await gmailEmail.value();
  const password = await gmailPassword.value();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });
}

// Send OTP function
exports.sendOtp = onRequest(
  {
    secrets: [gmailEmail, gmailPassword],
  },
  async (req, res) => {
    try {
      const { email, message, otp } = req.body;

      // Validate request body
      if (!email || !message || !otp) {
        return res.status(400).send("Missing email, message, or OTP");
      }

      const transporter = await createTransporter();

      // Email content
    const mailOptions = {
      from: `"True Look" <${await gmailEmail.value()}>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2c3e50;">Hello,</h2>
          <p>You (or someone else) requested to reset your password for your <strong>True Look</strong> account.</p>
          
          <p style="font-size: 18px;">
            <strong>Your OTP code is: <span style="color: #e74c3c;">${otp}</span></strong>
          </p>

          <p>⏰ This code will expire in <strong>5 minutes</strong>. Please do not share it with anyone.</p>

          <p>If you did not request a password reset, you can safely ignore this email.</p>

          <p>Thank you,<br/>
          <strong>The True Look Team</strong></p>
          
          <hr style="border:none; border-top:1px solid #ccc; margin-top:20px;" />
          <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply.</p>
        </div>
        `,
      };


      await transporter.sendMail(mailOptions);

      res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
    }
  }
);
