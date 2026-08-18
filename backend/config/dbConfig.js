const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "indra@sql",
    database: "vishwakarmaDB"
});

module.exports = db;
