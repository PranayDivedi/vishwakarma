const express = require("express");
const session = require("express-session");
const path = require("path");

/* ================= ROUTES ================= */
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const mdRoutes = require("./routes/mdRoutes");
const supervisorRoutes = require("./routes/supervisorRoutes");
const clientRoutes = require("./routes/clientRoutes");
const procurementRoutes=require('./routes/procurementRoutes')
const resetPasswordRoutes=require('./routes/resetPasswordRoutes')

/* ================= APP ================= */
const app = express();


app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});
/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use(session({
    name: "vishwakarma.sid",
    secret: "VISHWAKARMA_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

/* ================= STATIC FILES ================= */

app.use(express.static(path.join(__dirname, "../public")));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error("Session destroy failed:", err);
            }

            res.clearCookie("vishwakarma.sid"); // MUST match session name
            res.sendFile(path.join(__dirname, "../frontend/Login.html"));
        });
    } else {
        res.sendFile(path.join(__dirname, "../frontend/Login.html"));
    }
});


/* ================= ROUTERS ================= */
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/md", mdRoutes);
app.use("/supervisor", supervisorRoutes);
app.use("/client", clientRoutes);
app.use("/procurement", procurementRoutes);
app.use("/resetPassword", resetPasswordRoutes);
/* ================= SERVER ================= */
const PORT = process.env.PORT || 1010;
app.listen(PORT, () => {
    console.log(`🚀 Vishwakarma ERP running at http://localhost:${PORT}`);
});
