const express = require("express");
const router = express.Router();
const db = require("../config/dbConfig");
const auth = require("../middleware/auth");
const path = require("path");

/* =====================================================
   SUPERVISOR / supervisor PAGES
===================================================== */

router.get("/dashboard",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/supervisor/dashboardPage.html")
);});

router.get("/siteDetailsPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend/supervisor/SiteDetailsPage.html")
);});
router.get("/employeesPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/supervisor/employeesPage.html")
);});

router.get("/clientRequirementsPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend/supervisor/clientRequirementsPage.html")
);});
router.get("/siteActivityPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/supervisor/siteActivityPage.html")
);});

router.get("/siteTasksPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend/supervisor/siteTasksPage.html")
);});
router.get("/siteMaterialsPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/supervisor/siteMaterialsPage.html")
);});

router.get("/sitePhotosPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend/supervisor/sitePhotosPage.html")
);});
router.get("/stockRequestsPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend/supervisor/stockRequestsPage.html")
);});
router.get("/performancePage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend/supervisor/performancePage.html")
);});
router.get("/allGalleryPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend/supervisor/allGalleryPage.html")
);});
router.get("/allSitesPage",auth.isAuthenticated,auth.isSupervisor,(req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend/supervisor/allSitesPage.html")
);});
/* =====================================================
   supervisor PROFILE
===================================================== */





/* =====================================================
   SITES (FULL CRUD)
===================================================== */
router.get("/supervisorSites", async (req, res) => {
    const { companyId } = req.session.user;
    const siteEngineerId = req.session.user.userId;
    const [rows] = await db.promise().query("SELECT * from sites WHERE companyId=? and siteEngineerId=?", [companyId,siteEngineerId]);
    res.json(rows);
});
router.get("/ongoingSupervisorSites", async (req, res) => {
    const { companyId } = req.session.user;
    const siteEngineerId = req.session.user.userId;
    const [rows] = await db.promise().query("SELECT * from sites WHERE companyId=? and siteEngineerId=? and status=?", [companyId,siteEngineerId,"ongoing"]);
    res.json(rows);
});


// GET SITE HUB DATA (Powers MDSiteDetailsPage.html)
router.get("/supervisorSites/:id", async (req, res) => {
    try {
        const { companyId } = req.session.user;
        const siteId = req.params.id;

        const [[site]] = await db.promise().execute(`
            SELECT s.*, u.username AS siteEngineerName 
            FROM sites s LEFT JOIN users u ON s.siteEngineerId = u.userId 
            WHERE s.siteId = ? AND s.companyId = ?`, [siteId, companyId]);

        if (!site) return res.status(404).json({ error: "Site not found" });

        const [activity] = await db.promise().execute("SELECT * FROM siteactivity WHERE siteId=? AND companyId=? ORDER BY activityDate DESC LIMIT 5", [siteId, companyId]);
        const [tasks] = await db.promise().execute("SELECT * FROM tasks WHERE siteId=? AND companyId=? LIMIT 5", [siteId, companyId]);
        const [materials] = await db.promise().execute("SELECT * FROM sitematerials WHERE siteId=? AND companyId=? LIMIT 5", [siteId, companyId]);
        const [photos] = await db.promise().execute("SELECT * FROM sitephotos WHERE siteId=? AND companyId=? ORDER BY uploadedAt DESC LIMIT 4", [siteId, companyId]);
        const [employees] = await db.promise().execute("SELECT * FROM employees WHERE assignedSiteId=? AND companyId=?", [siteId, companyId]);
        res.json({ site, activity, tasks, materials, photos, employees});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/supervisorSites", async (req, res) => {
    try {
        const { companyId } = req.session.user;
        const { name, status, risk, completion, budget, startDate, deadline, workersCount, siteEngineer } = req.body;
        const siteId = `SITE-${companyId.split("-")[1]}-${Math.floor(10000 + Math.random() * 90000)}`;
        await db.promise().query("INSERT INTO sites (siteId, companyId, siteName, status, risk, completion, budget, startDate, deadline, workersCount, siteEngineerId) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            [siteId, companyId, name, status || "ongoing", risk || "On Track", completion || 0, budget || 0, startDate || null, deadline || null, workersCount || 0, siteEngineer]);
        res.json({ message: "Site created", siteId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});



router.get(
    "/client-requirements",
    auth.isAuthenticated,
    async (req, res) => {
        try {
            const companyId = req.session.user.companyId;
            const { siteId } = req.query;
const siteEngineerId = req.session.user.userId;
            let sql = `
                SELECT
                    cr.requirementId,
                    cr.siteId,
                    s.siteName,
                    cr.details,
                    cr.completed,
                    cr.createdAt
                FROM clientrequirements cr
                LEFT JOIN sites s ON cr.siteId = s.siteId
                WHERE cr.companyId = ? and s.siteEngineerId=?
            `;
            const params = [companyId,siteEngineerId];

            if (siteId) {
                sql += " AND cr.siteId = ?";
                params.push(siteId);
            }

            sql += " ORDER BY cr.createdAt DESC";

            const [rows] = await db.promise().execute(sql, params);
            res.json(rows);
        } catch (err) {
            console.error("GET CLIENT REQUIREMENTS ERROR:", err);
            res.status(500).json({ error: "Failed to fetch requirements" });
        }
    }
);
router.post(
    "/client-requirements",
    auth.isAuthenticated,
    async (req, res) => {
        try {
            const { siteId, details } = req.body;
            const companyId = req.session.user.companyId;

            if (!siteId || !details) {
                return res.status(400).json({ error: "Missing fields" });
            }

            await db.promise().execute(
                `
                INSERT INTO clientrequirements
                (companyId, siteId, details)
                VALUES (?, ?, ?)
                `,
                [companyId, siteId, details]
            );

            res.status(201).json({ message: "Requirement added" });
        } catch (err) {
            console.error("ADD CLIENT REQUIREMENT ERROR:", err);
            res.status(500).json({ error: "Failed to add requirement" });
        }
    }
);
router.put(
    "/client-requirements/:id",
    auth.isAuthenticated,
    async (req, res) => {
        try {
            const { details } = req.body;
            const companyId = req.session.user.companyId;

            await db.promise().execute(
                `
                UPDATE clientrequirements
                SET details = ?
                WHERE requirementId = ? AND companyId = ?
                `,
                [details, req.params.id, companyId]
            );

            res.json({ message: "Requirement updated" });
        } catch (err) {
            console.error("UPDATE CLIENT REQUIREMENT ERROR:", err);
            res.status(500).json({ error: "Failed to update requirement" });
        }
    }
);
router.delete(
    "/client-requirements/:id",
    auth.isAuthenticated,
    async (req, res) => {
        try {
            const companyId = req.session.user.companyId;

            await db.promise().execute(
                `
                DELETE FROM clientrequirements
                WHERE requirementId = ? AND companyId = ?
                `,
                [req.params.id, companyId]
            );

            res.json({ message: "Requirement deleted" });
        } catch (err) {
            console.error("DELETE CLIENT REQUIREMENT ERROR:", err);
            res.status(500).json({ error: "Failed to delete requirement" });
        }
    }
);


router.patch(
    "/client-requirements/:id/status",
    async (req, res) => {
        try {
            const { completed } = req.body;
            const companyId = req.session.user.companyId;

            await db.promise().execute(
                `
                UPDATE clientrequirements
                SET completed = ?
                WHERE requirementId = ? AND companyId = ?
                `,
                [completed ? 1 : 0, req.params.id, companyId]
            );

            res.json({ message: "Status updated" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to update status" });
        }
    }
);
router.get('/myPerformanceLogs', async (req, res) => {
    try {
        const companyId = req.session.user.companyId;
        const supervisorId = req.session.user.userId; // Securely get ID from session

        const [logs] = await db.promise().query(`
            SELECT 
                p.*, 
                s.siteName 
            FROM siteperformance p
            JOIN sites s ON p.siteId = s.siteId
            WHERE p.companyId = ? AND p.supervisorId = ?
            ORDER BY p.createdAt DESC`, 
            [companyId, supervisorId]
        );

        res.json(logs);
    } catch (err) {
        console.error("Error fetching supervisor logs:", err);
        res.status(500).json({ error: "Failed to load performance data" });
    }
});



router.get("/allSitePhotos", async (req, res) => {
    // Assuming companyId is stored in session after login
    const { companyId,userId } = req.session.user;

    try {
        // We JOIN with the sites table to get the siteName for each photo
        const query = `
            SELECT 
                sp.photoId, 
                sp.siteId, 
                s.siteName, 
                sp.photoUrl, 
                sp.caption, 
                sp.uploadedAt 
            FROM sitephotos sp
            JOIN sites s ON sp.siteId = s.siteId
            WHERE sp.companyId = ? and s.siteEngineerId=?
            ORDER BY sp.uploadedAt DESC
        `;

        const [rows] = await db.promise().execute(query, [companyId,userId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching gallery assets:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

////////////////////////////////////////////////////////////////////////////////


module.exports = router;
