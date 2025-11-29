// index.js
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
require('dotenv').config();

// Configure your email transport using Gmail (or other SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,   
    pass: process.env.GMAIL_PASSWORD 
  }
});

// Function to generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Firebase function to send OTP
exports.sendOtp = functions.https.onRequest(async (req, res) => {
  const { email, message } = req.body;

  if (!email) {
    return res.status(400).send({ success: false, message: "Email is required" });
  }

  const otp = generateOTP();

  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: email,
    subject: message,
    text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).send({ success: true, message: "OTP sent successfully", otp }); // you can choose to remove OTP from response for security
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).send({ success: false, message: "Failed to send OTP" });
  }
});
