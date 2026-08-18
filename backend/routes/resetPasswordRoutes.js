const express = require("express");
const router = express.Router();
const db = require("../config/dbConfig");
const path = require("path");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
 // adjust if needed



 const transporter = nodemailer.createTransport({
     service: "gmail",
     auth: {
         user: "chatrapathi12052005@gmail.com",
         pass: "rsok ruxf gfuf ktbb" // Gmail App Password
     }
 });
//  const transporter = nodemailer.createTransport({
//    host: "smtp.zoho.in",
//    port: 465,
//    secure: true,
//    auth: {
//      user: "info@sipss.in",
//      pass: "CWWw eb9V car3"
//    }
//  });

 const SALT_ROUNDS = 10;
/* ================= PAGE ================= */

router.get("/forgetPasswordPage", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/forgetPasswordPage.html"));
});

/* ================= SEND OTP ================= */

router.post("/send-password-otp", async (req, res) => {
  const { userId, companyId } = req.body;

  if (!userId || !companyId) {
    return res.status(400).json({ message: "User ID and Company are required." });
  }

  try {
    /* 1. Get user email */
    const [rows] = await db.promise().query(
      `SELECT userEmail FROM users WHERE userId=? AND companyId=?`,
      [userId, companyId]
    );

    if (!rows.length) {
      return res.json({ message: "If account exists, OTP sent." });
    }

    const email = rows[0].userEmail;

    /* 2. Generate OTP */
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    /* 3. Remove old OTPs for email */
    await db.promise().query(
      `DELETE FROM emailOtps WHERE email=?`,
      [email]
    );

    /* 4. Insert OTP */
    await db.promise().query(
      `INSERT INTO emailOtps (email, otp, expiresAt)
       VALUES (?, ?, ?)`,
      [email, otp, expiresAt]
    );

    /* 5. Send Email */
    await transporter.sendMail({
      from: `"HR Support" <${process.env.EMAIL_user}>`,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`
    });

    res.json({ message: "If account exists, OTP sent." });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Error while sending OTP." });
  }
});

/* ================= VERIFY OTP ================= */

router.post("/verify-password-otp", async (req, res) => {
  const { userId, companyId, OTP } = req.body;

  if (!userId || !companyId || !OTP) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    /* get email again */
    const [userRows] = await db.promise().query(
      `SELECT userEmail FROM users WHERE userId=? AND companyId=?`,
      [userId, companyId]
    );

    if (!userRows.length) {
      return res.status(400).json({ message: "Invalid request." });
    }

    const email = userRows[0].userEmail;

    /* find OTP */
    const [otpRows] = await db.promise().query(
      `SELECT * FROM emailOtps WHERE email=?`,
      [email]
    );

    if (!otpRows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const r = otpRows[0];

    if (new Date() > new Date(r.expiresAt) || r.otp !== OTP) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    /* delete otp */
    await db.promise().query(
      `DELETE FROM emailOtps WHERE otpId=?`,
      [r.otpId]
    );

    /* store verified user in session */
    req.session.resetUser = { userId, companyId };

    res.json({ message: "OTP verified successfully." });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "OTP verification failed." });
  }
});

/* ================= RESET PASSWORD ================= */

router.post("/reset-password", async (req, res) => {
  const { NewPassword } = req.body;

  if (!req.session.resetUser) {
    return res.status(403).json({ message: "OTP verification required." });
  }

  const { userId, companyId } = req.session.resetUser;

  if (!NewPassword || NewPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  try {
    const hash = await bcrypt.hash(NewPassword, 10);

    const [result] = await db.promise().query(
      `UPDATE users SET password=? WHERE userId=? AND companyId=?`,
      [hash, userId, companyId]
    );

    delete req.session.resetUser;

    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Password changed successfully!" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Error while resetting password." });
  }
});

module.exports = router;
