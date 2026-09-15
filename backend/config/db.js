const mysql = require('mysql2/promise');
const fs = require('fs');
const dns = require('dns');

// Managed MySQL (Aiven) hostnames resolve to BOTH a real IPv4 and a NAT64
// IPv6 (64:ff9b::) address. The IPv6 path is frequently unreachable on
// local/office networks and stalls the TLS handshake → intermittent
// ETIMEDOUT while the next attempt happens to pick IPv4 and succeeds.
// Prefer IPv4 for every DNS lookup made by this process (server + worker +
// migration scripts all load this module first).
dns.setDefaultResultOrder('ipv4first');

// TLS CA certificate for managed MySQL (Aiven, PlanetScale, RDS, etc.).
// Order of preference:
//   1. /etc/secrets/ca.pem        — Render-mounted secret file
//   2. DB_CA_CERT (env)           — inline PEM string (local .env / dashboard)
//   3. DB_CA_CERT_PATH (env)      — path to a PEM file
function readCaCert() {
  if (fs.existsSync('/etc/secrets/ca.pem')) {
    return fs.readFileSync('/etc/secrets/ca.pem', 'utf8');
  }
  const envCert = process.env.DB_CA_CERT;
  if (envCert && envCert.trim()) {
    return envCert;
  }
  const certPath = process.env.DB_CA_CERT_PATH;
  if (certPath && fs.existsSync(certPath)) {
    return fs.readFileSync(certPath, 'utf8');
  }
  return undefined;
}

const caCert = readCaCert();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'tabulation_db',
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 20000,
    ...(caCert && { ssl: { ca: caCert } }),
});

module.exports = pool;