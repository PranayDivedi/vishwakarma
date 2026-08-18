const express = require("express");
const router = express.Router();
const db = require("../config/dbConfig");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

/* =========================================================
   EMAIL CONFIG (GMAIL APP PASSWORD)
========================================================= */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "chatrapathi12052005@gmail.com",
        pass: "rsok ruxf gfuf ktbb" // Gmail App Password
    }
});
// const transporter = nodemailer.createTransport({
//   host: "smtp.zoho.in",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "info@sipss.in",
//     pass: "fukh8StTkpCE"
//   }
// });

const SALT_ROUNDS = 10;

/* =========================================================
   COMPANY SEARCH (LOGIN AUTOCOMPLETE)
========================================================= */
router.get("/companies/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const [rows] = await db.promise().query(
            `SELECT companyId, companyName
             FROM companies
             WHERE companyName LIKE ?
             ORDER BY companyName
             LIMIT 10`,
            [`%${q}%`]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

/* =========================================================
   CHECK IF MD EXISTS
========================================================= */
router.get("/company/has-md/:companyId", async (req, res) => {
    const { companyId } = req.params;

    try {
        const [rows] = await db.promise().query(
            `SELECT userId
             FROM users
             WHERE companyId=? AND role='md'
             LIMIT 1`,
            [companyId]
        );

        res.json({ hasMD: rows.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ hasMD: true });
    }
});

/* =========================================================
   SEND OTP (EMAIL FROM COMPANIES TABLE)
========================================================= */
router.post("/md/send-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Company email is required" });
    }

    try {
   
       
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.promise().query(
            "DELETE FROM emailOtps WHERE email=?",
            [email]
        );

        await db.promise().query(
            `INSERT INTO emailOtps (email, otp, expiresAt)
             VALUES (?, ?, ?)`,
            [email, otp, expiresAt]
        );

        await transporter.sendMail({
            from: `"Vishwakarma ERP" <chatrapathi12052005@gmail.com>`,
            to: email,
            subject: "OTP for MD Registration",
            html: `
                <h3>Your OTP: <b>${otp}</b></h3>
                <p>This OTP is valid for 5 minutes.</p>
            `
        });

        res.json({ message: "OTP sent to company email" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});


/* =========================================================
   VERIFY OTP & CREATE MD (bcrypt applied)
========================================================= */

function makeCode(text) {
    return text
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, "X");
}

router.post("/md/signup", async (req, res) => {
    const { name, password, userEmail, otp, companyId } = req.body;

    if (!name || !password || !otp || !companyId) {
        return res.status(400).json({ error: "All fields required" });
    }

    try {
        /* ================= FETCH COMPANY ================= */
        const [companies] = await db.promise().query(
            `SELECT companyName, contactEmail
             FROM companies
             WHERE companyId=?
             LIMIT 1`,
            [companyId]
        );

        if (!companies.length) {
            return res.status(400).json({ error: "Invalid company" });
        }

        const companyName = companies[0].companyName;
        const email = companies[0].contactEmail; // company email

        /* ================= VERIFY OTP ================= */
        const [otpRows] = await db.promise().query(
            `SELECT otpId
             FROM emailOtps
             WHERE email=? AND otp=? AND expiresAt > NOW()`,
            [email, otp]
        );

        if (!otpRows.length) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        /* ================= CHECK EXISTING MD ================= */
        const [existing] = await db.promise().query(
            `SELECT userId FROM users
             WHERE companyId=? AND role='md'`,
            [companyId]
        );

        if (existing.length) {
            return res.status(400).json({ error: "MD already exists" });
        }

        /* ================= GENERATE ID ================= */
        const companyCode = makeCode(companyName);
        const userCode = makeCode(name);

        const [last] = await db.promise().query(
            `SELECT companyId
             FROM users
             WHERE companyId LIKE ?
             ORDER BY companyId DESC
             LIMIT 1`,
            [`${companyCode}-${userCode}-%`]
        );

        let nextNumber = 1;
        if (last.length) {
            const lastNum = parseInt(last[0].companyId.split("-")[2], 10);
            nextNumber = lastNum + 1;
        }

        const userId =
            `${companyCode}-${userCode}-${String(nextNumber).padStart(3, "0")}`;

        /* ================= HASH PASSWORD ================= */
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        /* ================= INSERT USER ================= */
        await db.promise().query(
            `INSERT INTO users
             (userId,username, password, role, userEmail, companyId)
             VALUES (?, ?,?,'md', ?,?)`,
            [userId,name, hashedPassword, userEmail,companyId]
        );

        /* ================= CLEAN OTP ================= */
        await db.promise().query(
            "DELETE FROM emailOtps WHERE email=?",
            [email]
        );

        /* ================= SEND EMAIL WITH ID ================= */
        await transporter.sendMail({
            from: `"Vishwakarma ERP" <chatrapathi12052005@gmail.com>`,
            to: userEmail || email,
            subject: "Your Vishwakarma ERP Login ID",
            html: `
                <h2>Welcome to Vishwakarma ERP</h2>
                <p>Hello <b>${name}</b>,</p>
                <p>Your MD account has been created successfully.</p>
                <p><b>Your Login ID:</b></p>
                <h3 style="color:#0d9488">${userId}</h3>
                <p>Please keep this ID safe for future reference.</p>
                <br/>
                <p>— Vishwakarma ERP Team</p>
            `
        });

        res.json({
            message: "MD registered successfully. ID sent to email.",
            generatedCompanyId: userId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


/* =========================================================
   LOGIN (bcrypt compare)
========================================================= */
router.post("/login", async (req, res) => {
    const { userId, password, companyId } = req.body;

    try {
        /* ================= ADMIN LOGIN ================= */
        if (userId === "Admin" && password === "Admin") {
            req.session.user = {
                userId: "Admin",
                role: "admin"
            };
            return res.json({ redirectUrl: "/admin" });
        }

        /* ================= VALIDATION ================= */
        if (!companyId || !userId || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        /* ================= USER LOOKUP ================= */
        const [rows] = await db.promise().query(
            `SELECT userId, username, password, role, companyId
             FROM users
             WHERE userId = ? AND companyId = ?`,
            [userId, companyId]
        );

        if (!rows.length) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = rows[0];

        /* ================= PASSWORD CHECK ================= */
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        /* ================= SESSION ================= */
        req.session.user = {
            userId: user.userId,
            username: user.username,
            role: user.role,
            companyId: user.companyId
        };

        /* ================= ROLE REDIRECT ================= */
        const redirectMap = {
            md: "/md/dashboard",
            supervisor: "/supervisor/dashboard",
            client: "/client/dashboard",
            admin: "/admin",
            procurementManager : "/procurement/stockRequestsPage"
        };

        const redirectUrl = redirectMap[user.role];

        if (!redirectUrl) {
            return res.status(403).json({ error: "Role not authorized" });
        }

        res.json({ redirectUrl });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/clientLogin', async (req, res) => {
    try {
        const { siteId } = req.body;

        const [rows] = await db.promise().query(
            `SELECT siteId, companyId, clientName
             FROM sites
             WHERE siteId = ? `,
            [siteId]
        );

        if (!rows.length) {
            return res.status(401).json({ error: "Invalid Site ID or Phone Number" });
        }

        /* ✅ save client session */
        req.session.client = {
            siteId: rows[0].siteId,
            companyId: rows[0].companyId,
            clientName: rows[0].clientName
        };

        res.json({ redirectUrl: "/client/dashboard" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



// authRoutes.js
router.get("/me", (req, res) => {
    if (!req.session || !req.session.user) {

        return res.send(`<script>
            alert('Not Authenticated');
            window.location.href='/'
            </script>`)
        return res.status(401).json({ error: "Not authenticated" });
    }

    res.json({
        userId: req.session.user.userId,
        name: req.session.user.username || req.session.user.name,
        role: req.session.user.role,
        companyId: req.session.user.companyId,
        avatar: req.session.user.avatar || null
    });
});

/* =========================================================
   LOGOUT
========================================================= */
router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie("vishwakarma.sid");
        res.json({ message: "Logged out successfully" });
    });
});

module.exports = router;
