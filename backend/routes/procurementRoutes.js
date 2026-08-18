const express = require("express");
const router = express.Router();
const db = require("../config/dbConfig");
const auth = require("../middleware/auth");
const path = require("path");


router.get('/stockRequestsPage',auth.isAuthenticated,auth.isProcurementManager,(req,res)=>{
  res.sendFile(path.join(__dirname, '../../frontend/stockRequestsPage.html'));
})

router.get("/sites", async (req, res) => {
   
    const [rows] = await db.promise().query("SELECT s.*, u.username AS siteEngineerName FROM sites s LEFT JOIN users u ON s.siteEngineerId = u.userId ");
    res.json(rows);
});


// 1. GET ALL STOCK REQUESTS
// Fetch requests belonging to the MD's company
router.get('/stock-requests', async (req, res) => {
    try {
   
        
        // Joining with sites table to get site name if needed
        const [rows] = await db.promise().query(
            `SELECT
    sr.*,
    s.siteName,
    s.siteEngineerId,
    u.phoneNumber AS siteEngineerPhone
FROM stockrequests sr
LEFT JOIN sites s
    ON sr.siteId = s.siteId
LEFT JOIN users u
    ON s.siteEngineerId = u.userId
ORDER BY sr.requestDate DESC;
`
         
        );
        
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching stock requests" });
    }
});


module.exports = router;