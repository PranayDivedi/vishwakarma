/**
 * Vishwakarma ERP - Auth Middleware (HYBRID)
 * ----------------------------------------
 * Supports:
 * - Page routes  → alert + redirect
 * - API routes   → JSON 401
 *
 * Roles:
 * admin | md | supervisor | client
 */

const ROLES = {
    ADMIN: "admin",
    MD: "md",
    SUPERVISOR: "supervisor",
    CLIENT: "client",
    PROCUREMENTMANAGER :"procurementManager"
};

/* =====================================================
   HELPER: Detect API (fetch / ajax) request
===================================================== */
const isApiRequest = (req) => {
    return (
        req.xhr ||
        req.headers.accept?.includes("application/json") ||
        req.headers["content-type"]?.includes("application/json")
    );
};

/* =====================================================
   HELPER: Not Authenticated Response
===================================================== */
const handleNotAuthenticated = (req, res) => {
    if (isApiRequest(req)) {
        return res.status(401).send(`
        <script>
            alert("Not Authenticated Please login to continue");
            window.location.href = "/";
        </script>
    `);
        
    }

    return res.send(`
        <script>
            alert("Please login to continue");
            window.location.href = "/";
        </script>
    `);
};

/* =====================================================
   HELPER: Forbidden (Wrong Role)
===================================================== */
const handleForbidden = (req, res, message) => {
    if (isApiRequest(req)) {
        return res.status(403).send(`
        <script>
            alert("${message}");
            window.location.href='/';
        </script>
    `);
    }

    return res.send(`
        <script>
            alert("${message}");
            window.location.href='/';
        </script>
    `);
};

/* =====================================================
   AUTH CHECK
===================================================== */
const isAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return handleNotAuthenticated(req, res);
    }
    next();
};

/* =====================================================
   ROLE CHECKERS
===================================================== */
const isAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return handleNotAuthenticated(req, res);
    }

    if (req.session.user.role !== ROLES.ADMIN) {
        return handleForbidden(req, res, "Admin access only");
    }

    next();
};

const isMD = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return handleNotAuthenticated(req, res);
    }

    if (req.session.user.role !== ROLES.MD) {
        return handleForbidden(req, res, "MD access only");
    }

    next();
};

const isSupervisor = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return handleNotAuthenticated(req, res);
    }

    if (req.session.user.role !== ROLES.SUPERVISOR) {
        return handleForbidden(req, res, "Supervisor access only");
    }

    next();
};

const isClient = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return handleNotAuthenticated(req, res);
    }

    if (req.session.user.role !== ROLES.CLIENT) {
        return handleForbidden(req, res, "Client access only");
    }

    next();
};

const isProcurementManager = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return handleNotAuthenticated(req, res);
    }

    if (req.session.user.role !== ROLES.PROCUREMENTMANAGER) {
        return handleForbidden(req, res, "Procurement Manager access only");
    }

    next();
};

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
    ROLES,
    isAuthenticated,
    isAdmin,
    isMD,
    isSupervisor,
    isClient,
    isProcurementManager
};
