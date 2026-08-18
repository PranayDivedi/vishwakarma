const express = require('express');
const router = express.Router();
const db = require('../config/dbConfig');
const auth = require('../middleware/auth');
const path = require('path');

/* =========================================================
   ADMIN PAGES
========================================================= */

/* Admin Dashboard – Company List Page */
router.get('/',auth.isAuthenticated,auth.isAdmin ,(req, res) => {
    res.sendFile(
        path.join(__dirname, '../../frontend/admin/adminDashboard.html')
    );
});

/* Admin Edit Company Page */
router.get('/AdminEditCompany',auth.isAuthenticated,auth.isAdmin, (req, res) => {
    res.sendFile(
        path.join(__dirname, '../../frontend/admin/adminEditCompany.html')
    );
});


/* =========================================================
   COMPANY MANAGEMENT APIs
========================================================= */

/* GET ALL COMPANIES */
router.get('/AllCompanies', async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT
                companyId,
                companyName,
                contactPerson,
                contactEmail,
                contactPhone,
                address,
                subscriptionEndDate,
                status,
                createdAt
            FROM companies
            ORDER BY createdAt DESC
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch companies' });
    }
});

/* GET SINGLE COMPANY */
router.get('/CompanyDataForAdmin', async (req, res) => {
    const { companyId } = req.query;

    if (!companyId) {
        return res.status(400).json({ message: 'companyId is required' });
    }

    try {
        const [rows] = await db.promise().query(
            'SELECT * FROM companies WHERE companyId = ? LIMIT 1',
            [companyId]
        );

        if (!rows.length) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch company' });
    }
});

/* ADD COMPANY */
router.post('/AdminAddCompany', async (req, res) => {
    const { companyName } = req.body;

    if (!companyName) {
        return res.status(400).json({ message: 'companyName is required' });
    }

    try {
        const [last] = await db.promise().query(
            'SELECT companyId FROM companies ORDER BY createdAt DESC LIMIT 1'
        );

        let nextCompanyId = 'CMP-1001';
        if (last.length) {
            const lastNo = parseInt(last[0].companyId.split('-')[1], 10);
            nextCompanyId = `CMP-${lastNo + 1}`;
        }

        await db.promise().query(
            'INSERT INTO companies (companyId, companyName, status) VALUES (?, ?, ?)',
            [nextCompanyId, companyName, 'Active']
        );

        res.json({ message: 'Company added', companyId: nextCompanyId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to add company' });
    }
});

/* UPDATE COMPANY */
router.put('/AdminUpdateCompany', async (req, res) => {
    const { companyId } = req.query;
    const { companyName, contactPerson, contactEmail, contactPhone,subscriptionEndDate, address,status } = req.body;

    if (!companyId) {
        return res.status(400).json({ message: 'companyId is required' });
    }

    try {
        const [result] = await db.promise().query(
            `
            UPDATE companies SET
                companyName=?,
                contactPerson=?,
                contactEmail=?,
                contactPhone=?,
                subscriptionEndDate=?,
                address=?,
                status=?
            WHERE companyId=?
            `,
            [companyName, contactPerson, contactEmail, contactPhone,subscriptionEndDate, address,status, companyId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json({ message: 'Company updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update company' });
    }
});

/* DELETE COMPANY */
router.delete('/AdminDeleteCompany', async (req, res) => {
    const { companyId } = req.query;

    if (!companyId) {
        return res.status(400).json({ message: 'companyId is required' });
    }

    try {
        const [result] = await db.promise().query(
            'DELETE FROM companies WHERE companyId=?',
            [companyId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json({ message: 'Company deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete company' });
    }
});

/* ENABLE / DISABLE COMPANY */
router.put('/ToggleCompanyStatus', async (req, res) => {
    const { companyId, status } = req.body;

    if (!companyId || !status) {
        return res.status(400).json({ message: 'companyId and status required' });
    }

    try {
        await db.promise().query(
            'UPDATE companies SET status=? WHERE companyId=?',
            [status, companyId]
        );

        res.json({ message: 'Company status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update status' });
    }
});

/* =========================================================
   MD & USER MANAGEMENT
========================================================= */

/* CHECK IF MD EXISTS */
router.get('/CompanyHasMD', async (req, res) => {
    const { companyId } = req.query;

    try {
        const [rows] = await db.promise().query(
            `SELECT userId FROM users
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

/* CREATE MD */
router.post('/AdminCreateMD', async (req, res) => {
    const { companyId, username, password } = req.body;

    if (!companyId || !username || !password) {
        return res.status(400).json({ message: 'All fields required' });
    }

    try {
        const [existing] = await db.promise().query(
            `SELECT userId FROM users
             WHERE companyId=? AND role='md'`,
            [companyId]
        );

        if (existing.length) {
            return res.status(400).json({ message: 'MD already exists' });
        }

        await db.promise().query(
            `INSERT INTO users (username, password, role, companyId, status)
             VALUES (?, ?, 'md', ?, 'active')`,
            [username, password, companyId]
        );

        res.json({ message: 'MD created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create MD' });
    }
});

/* GET COMPANY USERS */
router.get('/CompanyUsers', async (req, res) => {
    const { companyId } = req.query;

    if (!companyId) {
        return res.status(400).json({ message: 'companyId required' });
    }

    try {
        const [rows] = await db.promise().query(
            `SELECT userId, username, role, status, createdAt
             FROM users
             WHERE companyId=?
             ORDER BY createdAt DESC`,
            [companyId]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

/* ENABLE / DISABLE USER */
router.put('/ToggleUserStatus', async (req, res) => {
    const { userId, status } = req.body;

    if (!userId || !status) {
        return res.status(400).json({ message: 'userId and status required' });
    }

    try {
        await db.promise().query(
            'UPDATE users SET status=? WHERE userId=?',
            [status, userId]
        );

        res.json({ message: 'User status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update user' });
    }
});

/* =========================================================
   ADMIN LOGOUT
========================================================= */

router.post('/Logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});




module.exports = router;
