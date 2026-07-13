const mysql = require('mysql2/promise');
const fs = require('fs');

const caCert = fs.existsSync('/etc/secrets/ca.pem')
    ? fs.readFileSync('/etc/secrets/ca.pem', 'utf8')
    : undefined;

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'tabulation_db',
    waitForConnections: true,
    connectionLimit: 10,
    ...(caCert && { ssl: { ca: caCert } }),
});

module.exports = pool;