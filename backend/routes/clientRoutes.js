const express = require("express");
const router = express.Router();
const db = require("../config/dbConfig");
const auth = require("../middleware/auth");
const path = require("path");

/* =====================================================
   CLIENT PAGE ROUTE
===================================================== */
/*
  URL: /client/dashboard
  Purpose: Serve Client Portal HTML
*/
router.get(
    "/dashboard",
    (req, res) => {
        res.sendFile(
            path.join(__dirname, "../../frontend/client/dashboard.html")
        );
    }
);

/* =====================================================
   CLIENT DASHBOARD API (SUMMARY DATA)
===================================================== */
/*
  URL: /client/api/dashboard
  Used by frontend fetch()
*/router.get("/site-details",async (req, res) => {
    try {

        const { siteId, companyId } = req.session.client;

        /* ---- SITE + ENGINEER INFO ---- */
        const [siteRows] = await db.promise().query(
            `SELECT 
                s.*,
                u.username AS siteEngineerName,
                u.phoneNumber AS siteEngineerPhone
             FROM sites s
             LEFT JOIN users u 
                ON s.siteEngineerId = u.userId
                AND s.companyId = u.companyId
             WHERE s.siteId = ? AND s.companyId = ?`,
            [siteId, companyId]
        );

        if (!siteRows.length) return res.status(404).json({ error: "Site not found" });

        const site = siteRows[0];

        /* ---- ACTIVITY ---- */
        const [activity] = await db.promise().query(
            `SELECT activityDate, description
             FROM siteactivity
             WHERE siteId=? AND companyId=?
             ORDER BY activityDate DESC
             LIMIT 10`,
            [siteId, companyId]
        );

        /* ---- TASKS ---- */
        const [tasks] = await db.promise().query(
            `SELECT description, assignedTo, status
             FROM tasks
             WHERE siteId=? AND companyId=?`,
            [siteId, companyId]
        );

        /* ---- MATERIALS ---- */
        const [materials] = await db.promise().query(
            `SELECT itemName, quantity, status
             FROM sitematerials
             WHERE siteId=? AND companyId=?`,
            [siteId, companyId]
        );

        /* ---- PHOTOS ---- */
        const [photos] = await db.promise().query(
            `SELECT photoUrl, caption, uploadedAt
             FROM sitephotos
             WHERE siteId=? AND companyId=?
             ORDER BY uploadedAt DESC`,
            [siteId, companyId]
        );

        /* ---- FINANCIALS ---- */
        const [fin] = await db.promise().query(
            `SELECT
                SUM(CASE WHEN type='credit' THEN amount ELSE 0 END) AS credit
             FROM sitetransactions
             WHERE siteId=? AND companyId=?`,
            [siteId, companyId]
        );
        const [transactions]=await db.promise().query(
            `
               select *  
             FROM sitetransactions
             WHERE siteId=? AND companyId=? and type='credit'`,
            [siteId, companyId]
        );
        res.json({
            site,
            activity,
            tasks,
            materials,
            photos,
            financials: fin[0] || { credit: 0 },
            transactions
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
