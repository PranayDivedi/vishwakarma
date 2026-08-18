const express = require("express");
const router = express.Router();
const db = require("../config/dbConfig");
const auth = require("../middleware/auth");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const uploadSitePhoto = require("../middleware/uploadSitePhoto");
/* =====================================================
   MULTER CONFIG – SITE PHOTOS
===================================================== */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/sitephotos"),
    filename: (req, file, cb) =>
        cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/* =====================================================
   PAGE ROUTES (MD UI)
===================================================== */
router.get("/dashboard",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/dashboardPage.html")));
router.get("/allSitesPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/allSitesPage.html")));
router.get("/employeesPage",auth.isAuthenticated,auth.isMD,auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/EmployeesPage.html")));
router.get("/financialsPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/financialsPage.html")));
router.get("/messagesPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/MDMessagesPage.html")));
router.get("/siteDetailsPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/MDSiteDetailsPage.html")));
router.get("/siteActivityPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/siteActivityPage.html")));
router.get("/siteMaterialsPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/siteMaterialsPage.html")));
router.get("/siteFinancialsPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/siteFinancialsPage.html")));
router.get("/sitePhotosPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/sitePhotosPage.html")));
router.get("/siteTasksPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/siteTasksPage.html")));
router.get("/addsitePage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/addsitePage.html")));
router.get("/editsitePage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/editSitePage.html")));
router.get("/clientRequirementsPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/clientRequirementsPage.html")));
router.get("/stockRequestsPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/stockRequestsPage.html")));
router.get("/allGalleryPage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/allGalleryPage.html")));
router.get("/performancePage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/performancePage.html")));
router.get("/taskspage",auth.isAuthenticated,auth.isMD, (req, res) => res.sendFile(path.join(__dirname, "../../frontend/md/taskspage.html")));


/* =====================================================
   DASHBOARD & KPI
===================================================== */
router.get("/dashboard/kpi", async (req, res) => {
    try {
        const { companyId } = req.session.user;
        const [[kpi]] = await db.promise().query(`
            SELECT
                COUNT(*) AS totalSites,
                ROUND(AVG(completion)) AS avgCompletion,
                SUM(budget) AS totalBudget,
                SUM(CASE WHEN risk = 'At Risk' THEN 1 ELSE 0 END) AS atRisk
            FROM sites
            WHERE companyId=?
        `, [companyId]);
        res.json(kpi);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/*///////////////============SITE DETAILS PAGE =============*?*/
router.get("/siteDetails/:id",  async (req, res) => {
    const siteId=req.params.id
    const { companyId } = req.session.user;
    const [rows] = await db.promise().query(
        "SELECT * FROM sites WHERE companyId=? and siteId=?",
        [companyId, siteId]
    );
    res.json(rows[0]);
});




/* =====================================================
   SITES (FULL CRUD)
===================================================== */
router.get("/sites", async (req, res) => {
    const { companyId } = req.session.user;
    const [rows] = await db.promise().query("SELECT s.*, u.username AS siteEngineerName FROM sites s LEFT JOIN users u ON s.siteEngineerId = u.userId WHERE s.companyId=?", [companyId]);
    res.json(rows);
});
router.get("/onGoingSites", async (req, res) => {
    const { companyId } = req.session.user;
    const [rows] = await db.promise().query("SELECT s.*, u.username AS siteEngineerName FROM sites s LEFT JOIN users u ON s.siteEngineerId = u.userId WHERE s.companyId=? AND s.status='ongoing'", [companyId]);
    res.json(rows);
});


// GET SITE HUB DATA (Powers MDSiteDetailsPage.html)
router.get("/sites/:id", async (req, res) => {
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
        const [[fin]] = await db.promise().execute(`
            SELECT 
                SUM(CASE WHEN type='Credit' THEN amount ELSE 0 END) as credit, 
                SUM(CASE WHEN type='Debit' THEN amount ELSE 0 END) as debit 
            FROM sitetransactions WHERE siteId=? AND companyId=?`, [siteId, companyId]);

        res.json({ site, activity, tasks, materials, photos, employees, financials: fin || { credit: 0, debit: 0 } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/sites", async (req, res) => {
    try {
        const { companyId } = req.session.user;
        const { name, status, risk, completion, budget, startDate, deadline, workersCount, siteEngineer, clientName, clientPhone, siteLocation } = req.body;
        const siteId = `SITE-${companyId.split("-")[1]}-${Math.floor(10000 + Math.random() * 90000)}`;
        await db.promise().query("INSERT INTO sites (siteId, companyId, siteName, status, risk, completion, budget, startDate, deadline, workersCount, siteEngineerId, clientName, clientPhoneNumber, siteLocation) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [siteId, companyId, name, status || "ongoing", risk || "On Track", completion || 0, budget || 0, startDate || null, deadline || null, workersCount || 0, siteEngineer, clientName, clientPhone, siteLocation]);
        res.json({ message: "Site created", siteId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/sites/:siteId", async (req, res) => {
    const { siteId } = req.params;
    const { companyId } = req.session.user;

    // Destructure all fields including the new conditional ones
    const { 
        siteName, 
        status, 
        risk, 
        completion, 
        budget, 
        startDate, 
        deadline, 
        workersCount, 
        siteEngineerId, 
        clientName, 
        clientPhoneNumber, // Matched to the 'name' attribute in the HTML form
        siteLocation,
        completedDate,
        feedback,
        haltReason,
        haltDate
    } = req.body;

    try {
        await db.promise().execute(
            `UPDATE sites SET 
                siteName=?, 
                status=?, 
                risk=?, 
                completion=?, 
                budget=?, 
                startDate=?, 
                deadline=?, 
                workersCount=?, 
                siteEngineerId=?, 
                clientName=?, 
                clientPhoneNumber=?, 
                siteLocation=?,
                completedDate=?,
                feedback=?,
                haltReason=?,
                haltDate=?
            WHERE siteId=? AND companyId=?`,
            [
                siteName, 
                status, 
                risk, 
                completion, 
                budget, 
                startDate || null, 
                deadline || null, 
                workersCount || 0, 
                siteEngineerId, 
                clientName, 
                clientPhoneNumber, 
                siteLocation,
                completedDate || null, // Handles empty date strings
                feedback || null,
                haltReason || null,
                haltDate || null,      // Handles empty date strings
                siteId, 
                companyId
            ]
        );

        res.json({ message: "Site updated successfully" });
    } catch (error) {
        console.error("Database Update Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/sites/:siteId", async (req, res) => {
    const { companyId } = req.session.user;
    await db.promise().execute("DELETE FROM sites WHERE siteId=? AND companyId=?", [req.params.siteId, companyId]);
    res.json({ message: "Deleted" });
});


router.get("/showSites", async (req, res) => {
    const { companyId } = req.session.user;
    const [rows] = await db.promise().query("SELECT s.siteId,s.siteName, u.username AS siteEngineerName FROM sites s LEFT JOIN users u ON s.siteEngineerId = u.userId WHERE s.companyId=?", [companyId]);
    res.json(rows);
});
/* =====================================================
   FINANCIAL TRANSACTIONS (FULL CRUD)
===================================================== */
router.get("/financials/:siteId", async (req, res) => {
    const [rows] = await db.promise().query("SELECT * FROM sitetransactions WHERE siteId=? AND companyId=? order by transactionDate desc", [req.params.siteId, req.session.user.companyId]);
    res.json(rows);
});

router.post("/financials", async (req, res) => {
    const { siteId, transactionDate, description, type, amount,modeOfPayment } = req.body;
    await db.promise().execute("INSERT INTO sitetransactions (companyId, siteId, transactionDate, description, type, amount,modeOfPayment) VALUES (?,?,?,?,?,?,?)",
        [req.session.user.companyId, siteId, transactionDate, description, type, amount,modeOfPayment]);
    res.json({ success: true });
});

router.put("/financials/:id", async (req, res) => {
    const { transactionDate, description, type, amount,modeOfPayment } = req.body;
    await db.promise().execute("UPDATE sitetransactions SET transactionDate=?, description=?, type=?,amount=?,modeOfPayment=? WHERE transactionId=? AND companyId=?",
        [transactionDate, description, type, amount,modeOfPayment, req.params.id, req.session.user.companyId]);
    res.json({ success: true });
});

router.delete("/financials/:id", async (req, res) => {
    await db.promise().execute("DELETE FROM sitetransactions WHERE transactionId=? AND companyId=?", [req.params.id, req.session.user.companyId]);
    res.json({ success: true });
});

/* =====================================================
   SITE ACTIVITY (FULL CRUD)
===================================================== */
router.get("/activity/:siteId", async (req, res) => {
    const [rows] = await db.promise().query("SELECT * FROM siteactivity WHERE siteId=? AND companyId=? ORDER BY activityDate DESC", [req.params.siteId, req.session.user.companyId]);
    res.json(rows);
});

router.post("/activity", async (req, res) => {
    const { siteId, activityDate, description } = req.body;
    await db.promise().execute("INSERT INTO siteactivity (companyId, siteId, activityDate, description) VALUES (?,?,?,?)", [req.session.user.companyId, siteId, activityDate, description]);
    res.json({ success: true });
});

router.put("/activity/:id", async (req, res) => {
    await db.promise().execute("UPDATE siteactivity SET activityDate=?, description=? WHERE activityId=? AND companyId=?", [req.body.activityDate, req.body.description, req.params.id, req.session.user.companyId]);
    res.json({ success: true });
});

router.delete("/activity/:id", async (req, res) => {
    await db.promise().execute("DELETE FROM siteactivity WHERE activityId=? AND companyId=?", [req.params.id, req.session.user.companyId]);
    res.json({ success: true });
});

/* =====================================================
   MATERIALS (FULL CRUD)
===================================================== */
router.get("/materials/:siteId", async (req, res) => {
    const [rows] = await db.promise().query("SELECT * FROM sitematerials WHERE siteId=? AND companyId=?", [req.params.siteId, req.session.user.companyId]);
    res.json(rows);
});

router.post("/materials", async (req, res) => {
    const { siteId, itemName, quantity, status } = req.body;
    console.log(siteId, itemName, quantity, status , 'ddskmdskmdsk',req.body)
    await db.promise().execute("INSERT INTO sitematerials (companyId, siteId, itemName, quantity, status) VALUES (?,?,?,?,?)", [req.session.user.companyId, siteId, itemName, quantity, status]);
    res.json({ success: true });
});

router.put("/materials/:id", async (req, res) => {
    const { itemName, quantity, status } = req.body;
    await db.promise().execute("UPDATE sitematerials SET itemName=?, quantity=?, status=? WHERE materialId=? AND companyId=?", [itemName, quantity, status, req.params.id, req.session.user.companyId]);
    res.json({ success: true });
});

router.delete("/materials/:id", async (req, res) => {
    await db.promise().execute("DELETE FROM sitematerials WHERE materialId=? AND companyId=?", [req.params.id, req.session.user.companyId]);
    res.json({ success: true });
});

/* =====================================================
   TASKS (FULL CRUD)
===================================================== */
router.get("/tasks/:siteId", async (req, res) => {
    const [rows] = await db.promise().query("SELECT * FROM tasks WHERE siteId=? AND companyId=?", [req.params.siteId, req.session.user.companyId]);
    res.json(rows);
});

router.get("/allTasks", async (req, res) => {
    const [rows] = await db.promise().query(`SELECT t.*, u.username,s.siteName
FROM tasks t
LEFT JOIN sites s ON t.siteId = s.siteId
LEFT JOIN users u ON u.userId = s.siteEngineerId
WHERE t.companyId = ?;
`, [req.session.user.companyId]);
    res.json(rows);
});

router.post("/tasks", async (req, res) => {
    const { siteId, description, assignedTo, deadline, status } = req.body;
    await db.promise().execute("INSERT INTO tasks (companyId, siteId, description, assignedTo, deadline, status) VALUES (?,?,?,?,?,?)", [req.session.user.companyId, siteId, description, assignedTo, deadline, status]);
    res.json({ success: true });
});

router.put("/tasks/:id", async (req, res) => {
    const { description, assignedTo, deadline, status } = req.body;
    await db.promise().execute("UPDATE tasks SET description=?, assignedTo=?, deadline=?, status=? WHERE taskId=? AND companyId=?", [description, assignedTo, deadline, status, req.params.id, req.session.user.companyId]);
    res.json({ success: true });
});

router.delete("/tasks/:id", async (req, res) => {
    await db.promise().execute("DELETE FROM tasks WHERE taskId=? AND companyId=?", [req.params.id, req.session.user.companyId]);
    res.json({ success: true });
});

/* =====================================================
   PHOTOS (WITH CAPTION)
===================================================== */

/* =====================================================
   GET PHOTOS BY SITE (READ)
===================================================== */
router.get("/photos/:siteId", async (req, res) => {
    try {
        const { siteId } = req.params;
        const companyId = req.session.user.companyId;

        const [rows] = await db.promise().execute(
            `SELECT photoId, siteId, photoUrl, caption, uploadedAt
             FROM sitephotos
             WHERE siteId = ? AND companyId = ?
             ORDER BY uploadedAt DESC`,
            [siteId, companyId]
        );

        res.json(rows);
    } catch (err) {
        console.error("GET PHOTOS ERROR:", err);
        res.status(500).json({ error: "Failed to load photos" });
    }
});

/* =====================================================
   ADD PHOTO (CREATE)  → multer comes next
===================================================== */
router.post(
    "/photos",
    uploadSitePhoto.single("photo"),
    async (req, res) => {
        try {
            const { siteId, caption } = req.body;
            const companyId = req.session.user.companyId;

            if (!req.file) {
                return res.status(400).json({ error: "Photo required" });
            }

            const photoUrl = `/uploads/sitephotos/${req.file.filename}`;

            await db.promise().execute(
                `INSERT INTO sitephotos (companyId, siteId, photoUrl, caption)
                 VALUES (?, ?, ?, ?)`,
                [companyId, siteId, photoUrl, caption || null]
            );

            res.status(201).json({ message: "Photo uploaded" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Upload failed" });
        }
    }
);

/* =====================================================
   DELETE PHOTO (DELETE)
===================================================== */
router.delete("/photos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.session.user.companyId;

        const [result] = await db.promise().execute(
            `DELETE FROM sitephotos
             WHERE photoId = ? AND companyId = ?`,
            [id, companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Photo not found" });
        }

        res.json({ message: "Photo deleted" });
    } catch (err) {
        console.error("DELETE PHOTO ERROR:", err);
        res.status(500).json({ error: "Delete failed" });
    }
});

/* =====================================================
   SUPERVISORS & EMPLOYEES (UNCHANGED CORE LOGIC)
===================================================== */
/* =========================
   SUPERVISORS (USERS)
========================= */

// GET all supervisors
router.get("/supervisors", async (req, res) => {
    const [rows] = await db.promise().execute(
        `SELECT 
    u.userId,
    u.username,
    u.userEmail,
    u.phoneNumber,
    CASE 
        WHEN COUNT(s.siteId) = 0 THEN JSON_ARRAY()
        ELSE JSON_ARRAYAGG(
            JSON_OBJECT(
                'siteId', s.siteId,
                'siteName', s.siteName
            )
        )
    END AS assignedSites
FROM users u
LEFT JOIN sites s 
    ON s.siteEngineerId = u.userId
WHERE u.companyId = ?
  AND u.role = 'supervisor'
GROUP BY 
    u.userId,
    u.username,
    u.userEmail,
    u.phoneNumber;
;
`,
        [req.session.user.companyId]
    );
    res.json(rows);
});

// POST add supervisor
router.post("/supervisors", async (req, res) => {
    const { userId, username, password, phoneNumber, userEmail } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    await db.promise().execute(
        `INSERT INTO users
         (userId, companyId, username, password, role, phoneNumber, userEmail)
         VALUES (?, ?, ?, ?, 'supervisor', ?, ?)`,
        [
            userId,
            req.session.user.companyId,
            username,
            passwordHash,          // 🔐 hash in production
            phoneNumber || null,
            userEmail || null
        ]
    );

    res.json({ message: "Supervisor created" });
});

// PUT update supervisor
router.put("/supervisors/:userId", async (req, res) => {
    const { username, phoneNumber, userEmail } = req.body;

    await db.promise().execute(
        `UPDATE users
         SET username = ?, phoneNumber = ?, userEmail = ?
         WHERE userId = ? AND companyId = ? AND role = 'supervisor'`,
        [
            username,
            phoneNumber || null,
            userEmail || null,
            req.params.userId,
            req.session.user.companyId
        ]
    );

    res.json({ message: "Supervisor updated" });
});

// DELETE supervisor
router.delete("/supervisors/:userId", async (req, res) => {
    await db.promise().execute(
        `DELETE FROM users
         WHERE userId = ? AND companyId = ? AND role = 'supervisor'`,
        [req.params.userId, req.session.user.companyId]
    );

    res.json({ message: "Supervisor deleted" });
});


////////////////////////////Procurement Manager////////
// GET all procurement managers
router.get("/procurementManagers", async (req, res) => {
    try {
        const [rows] = await db.promise().execute(
            `SELECT 
                userId,
                username,
                userEmail,
                phoneNumber
            FROM users
            WHERE companyId = ?
              AND role = 'procurementManager'`,
            [req.session.user.companyId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch procurement managers" });
    }
});

// POST add procurement manager
router.post("/procurementManagers", async (req, res) => {
    try {
        const { userId, username, password, phoneNumber, userEmail } = req.body;
        
        // Use provided password or default to '12345678' if not sent
        const passToHash = password || "12345678";
        const passwordHash = await bcrypt.hash(passToHash, 10);

        await db.promise().execute(
            `INSERT INTO users
             (userId, companyId, username, password, role, phoneNumber, userEmail)
             VALUES (?, ?, ?, ?, 'procurementManager', ?, ?)`,
            [
                userId,
                req.session.user.companyId,
                username,
                passwordHash,
                phoneNumber || null,
                userEmail || null
            ]
        );

        res.json({ message: "Procurement Manager created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create procurement manager" });
    }
});

// PUT update procurement manager
router.put("/procurementManagers/:userId", async (req, res) => {
    try {
        const { username, phoneNumber, userEmail } = req.body;

        const [result] = await db.promise().execute(
            `UPDATE users
             SET username = ?, phoneNumber = ?, userEmail = ?
             WHERE userId = ? 
               AND companyId = ? 
               AND role = 'procurementManager'`,
            [
                username,
                phoneNumber || null,
                userEmail || null,
                req.params.userId,
                req.session.user.companyId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Procurement Manager not found" });
        }

        res.json({ message: "Procurement Manager updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update procurement manager" });
    }
});

// DELETE procurement manager
router.delete("/procurementManagers/:userId", async (req, res) => {
    try {
        await db.promise().execute(
            `DELETE FROM users
             WHERE userId = ? 
               AND companyId = ? 
               AND role = 'procurementManager'`,
            [req.params.userId, req.session.user.companyId]
        );

        res.json({ message: "Procurement Manager deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete procurement manager" });
    }
});



/* =========================
   EMPLOYEES ROUTES
========================= */
/* =========================
   EMPLOYEES
========================= */

// GET all employees
router.get("/employees", async (req, res) => {
    const [rows] = await db.promise().execute(
        `SELECT e.*, s.siteName
         FROM employees e
         LEFT JOIN sites s ON e.assignedSiteId = s.siteId
         WHERE e.companyId = ?`,
        [req.session.user.companyId]
    );
    res.json(rows);
});

// POST add employee
router.post("/employees", async (req, res) => {
    const {
        employeeId,
        employeeName,
        role,
        phoneNumber,
        status,
        assignedSiteId
    } = req.body;

    await db.promise().execute(
        `INSERT INTO employees
         (employeeId, companyId, employeeName, role, phoneNumber, status, assignedSiteId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            employeeId,
            req.session.user.companyId,
            employeeName,
            role,
            phoneNumber || null,
            status || 'active',
            assignedSiteId || null
        ]
    );

    res.json({ message: "Employee added" });
});

// PUT update employee
router.put("/employees/:employeeId", async (req, res) => {
    const {
        employeeName,
        role,
        phoneNumber,
        status,
        assignedSiteId
    } = req.body;

    await db.promise().execute(
        `UPDATE employees
         SET employeeName = ?, role = ?, phoneNumber = ?, status = ?, assignedSiteId = ?
         WHERE employeeId = ? AND companyId = ?`,
        [
            employeeName,
            role,
            phoneNumber || null,
            status || 'active',
            assignedSiteId || null,
            req.params.employeeId,
            req.session.user.companyId
        ]
    );

    res.json({ message: "Employee updated" });
});

// DELETE employee
router.delete("/employees/:employeeId", async (req, res) => {
    await db.promise().execute(
        `DELETE FROM employees
         WHERE employeeId = ? AND companyId = ?`,
        [req.params.employeeId, req.session.user.companyId]
    );

    res.json({ message: "Employee deleted" });
});




/* =====================================================
   FINANCIAL SUMMARY (KPIs)
===================================================== */
router.get(
    "/summaryFinancials/summary",
    auth.isAuthenticated,
    auth.isMD,
    async (req, res) => {
        try {
            const companyId = req.session.user.companyId;

            const [[summary]] = await db.promise().execute(
                `
                SELECT
                    COALESCE(SUM(CASE WHEN type='credit' THEN amount END), 0) AS totalInflow,
                    COALESCE(SUM(CASE WHEN type='debit' THEN amount END), 0) AS totalOutflow,
                    COALESCE(
                        SUM(CASE WHEN type='Credit' THEN amount END), 0
                    ) -
                    COALESCE(
                        SUM(CASE WHEN type='Debit' THEN amount END), 0
                    ) AS netBalance
                FROM sitetransactions
                WHERE companyId = ?
                `,
                [companyId]
            );
console.log(summary,"ROute 1")
            res.json(summary);
        } catch (err) {
            console.error("FINANCIAL SUMMARY ERROR:", err);
            res.status(500).json({ error: "Failed to load financial summary" });
        }
    }
);

/* =====================================================
   TRANSACTION HISTORY (OPTIONAL SITE FILTER)
===================================================== */
router.get(
    "/summaryFinancials/transactions",
    auth.isAuthenticated,
    auth.isMD,
    async (req, res) => {
        try {
            const companyId = req.session.user.companyId;
            const { siteId } = req.query;

            let sql = `
                SELECT
                    t.transactionId,
                    t.transactionDate,
                    t.description,
                    t.type,
                    t.amount,
                    t.modeOfPayment,
                    s.siteName
                FROM sitetransactions t
                LEFT JOIN sites s ON t.siteId = s.siteId
                WHERE t.companyId = ?
            `;

            const params = [companyId];

            if (siteId) {
                sql += " AND t.siteId = ?";
                params.push(siteId);
            }

            sql += " ORDER BY t.transactionDate DESC";

            const [rows] = await db.promise().execute(sql, params);

            res.json(rows);
        } catch (err) {
            console.error("FINANCIAL TRANSACTIONS ERROR:", err);
            res.status(500).json({ error: "Failed to load transactions" });
        }
    }
);

router.get(
    "/client-requirements",
    auth.isAuthenticated,
    async (req, res) => {
        try {
            const companyId = req.session.user.companyId;
            const { siteId } = req.query;

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
                WHERE cr.companyId = ?
            `;
            const params = [companyId];

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



// 1. GET ALL STOCK REQUESTS
// Fetch requests belonging to the MD's company
router.get('/stock-requests', async (req, res) => {
    try {
        const companyId = req.session.user.companyId; 
        
        // Joining with sites table to get site name if needed
        const [rows] = await db.promise().query(
            `SELECT s.*,si.siteName FROM stockrequests s left join sites si on s.siteId=si.siteId 
             WHERE s.companyId = ? 
             ORDER BY s.requestDate DESC`, 
            [companyId]
        );
        
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching stock requests" });
    }
});

// 2. CREATE NEW STOCK REQUEST
router.post('/stock-requests',  async (req, res) => {
    try {
        const { siteId, item, quantity, requestDate, status,deadline } = req.body;
       const companyId = req.session.user.companyId;
console.log(companyId)
        if (!siteId || !item || !quantity) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const [result] = await db.promise().query(
            `INSERT INTO stockrequests (companyId, siteId, item, quantity, requestDate, status,deadline) 
             VALUES (?, ?, ?, ?, ?, ?,?)`,
            [companyId, siteId, item, quantity, requestDate || new Date(), status || 'Pending',deadline]
        );

        res.status(201).json({ 
            message: "Request created successfully", 
            requestId: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating stock request" });
    }
});

// 3. UPDATE STOCK REQUEST (Edit or Approve/Reject)
router.put('/stock-requests/:id',  async (req, res) => {
    try {
        const requestId = req.params.id;
        const { siteId, item, quantity, status,deadline } = req.body;
       const companyId = req.session.user.companyId;

        const [result] = await db.promise().query(
            `UPDATE stockrequests 
             SET siteId = ?, item = ?, quantity = ?, status = ?,deadline=? 
             WHERE requestId = ? AND companyId = ?`,
            [siteId, item, quantity, status,deadline, requestId, companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found or unauthorized" });
        }

        res.status(200).json({ message: "Request updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating stock request" });
    }
});

// 4. DELETE STOCK REQUEST
router.delete('/stock-requests/:id',  async (req, res) => {
    try {
        const requestId = req.params.id;
        const companyId = req.session.user.companyId;

        const [result] = await db.promise().query(
            "DELETE FROM stockrequests WHERE requestId = ? AND companyId = ?",
            [requestId, companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.status(200).json({ message: "Request deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting stock request" });
    }
});





router.get("/allSitePhotos", async (req, res) => {
    // Assuming companyId is stored in session after login
    const { companyId } = req.session.user;

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
            WHERE sp.companyId = ?
            ORDER BY sp.uploadedAt DESC
        `;

        const [rows] = await db.promise().execute(query, [companyId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching gallery assets:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});





/**
 * 1. GET METADATA FOR DROPDOWNS
 * Fetches sites and supervisors belonging to the MD's company
 */
router.get('/form-data', async (req, res) => {
    try {
        const companyId = req.session.user.companyId; // Obtained from auth middleware

        // Fetch sites for this company
        const [sites] = await db.promise().query(
            "SELECT siteId, siteName FROM sites WHERE companyId = ?", 
            [companyId]
        );

        // Fetch users with the role 'supervisor' for this company
        console.log(companyId)
        const [supervisors] = await db.promise().query(
            "SELECT userId, username FROM users WHERE companyId = ? AND role = 'supervisor'", 
            [companyId]
        );

        res.json({ sites, supervisors });
    } catch (err) {
        console.error("Error fetching form data:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * 2. GET ALL PERFORMANCE LOGS
 * Joins with sites and users to get display names
 */
router.get('/performanceLogs', async (req, res) => {
    try {
        const companyId = req.session.user.companyId;

        const [logs] = await db.promise().query(`
            SELECT 
                p.*, 
                s.siteName, 
                u.username as supervisorName 
            FROM siteperformance p
            JOIN sites s ON p.siteId = s.siteId
            LEFT JOIN users u ON p.supervisorId = u.userId AND p.companyId = u.companyId
            WHERE p.companyId = ?
            ORDER BY p.createdAt DESC`, 
            [companyId]
        );

        res.json(logs);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: "Failed to fetch performance logs" });
    }
});

/**
 * 3. CREATE A NEW PERFORMANCE LOG
 */
router.post('/performanceLogs', async (req, res) => {
    try {
        const { siteId, supervisorId, caseType, details, rating } = req.body;
        const companyId = req.session.user.companyId;

        if (!siteId || !caseType || !details) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const [result] = await db.promise().query(
            `INSERT INTO siteperformance (companyId, siteId, supervisorId, caseType, details, rating) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [companyId, siteId, supervisorId, caseType, details, rating || 5]
        );

        res.status(201).json({ success: true, insertId: result.insertId });
    } catch (err) {
        console.error("Error creating log:", err);
        res.status(500).json({ error: "Failed to save log" });
    }
});

/**
 * 4. UPDATE AN EXISTING LOG
 */
router.put('/performanceLogs/:id', async (req, res) => {
    try {
        const { siteId, supervisorId, caseType, details, rating } = req.body;
        const performanceId = req.params.id;

        const [result] = await db.promise().query(
            `UPDATE siteperformance 
             SET siteId = ?, supervisorId = ?, caseType = ?, details = ?, rating = ? 
             WHERE performanceId = ?`,
            [siteId, supervisorId, caseType, details, rating, performanceId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Log not found" });
        }

        res.json({ success: true, message: "Updated successfully" });
    } catch (err) {
        console.error("Error updating log:", err);
        res.status(500).json({ error: "Update failed" });
    }
});

/**
 * 5. DELETE A LOG
 */
router.delete('/performanceLogs/:id', async (req, res) => {
    try {
        const performanceId = req.params.id;

        const [result] = await db.promise().query(
            "DELETE FROM siteperformance WHERE performanceId = ?", 
            [performanceId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Log not found" });
        }

        res.json({ success: true, message: "Log deleted" });
    } catch (err) {
        console.error("Error deleting log:", err);
        res.status(500).json({ error: "Deletion failed" });
    }
});
module.exports = router;