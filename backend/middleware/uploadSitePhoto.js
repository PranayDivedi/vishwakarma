const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =====================================================
   STORAGE CONFIG
===================================================== */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/sitephotos";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName =
            `site_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, uniqueName);
    }
});

/* =====================================================
   FILE FILTER
===================================================== */
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (
        file.mimetype.startsWith("image/") ||
        allowedMimes.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error("Only images, PDF, and Word documents are allowed"), false);
    }
};


/* =====================================================
   MULTER INSTANCE
===================================================== */
const uploadSitePhoto = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

module.exports = uploadSitePhoto;
