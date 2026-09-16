const mysql = require('mysql2/promise');
const fs = require('fs');
const dns = require('dns');
const { X509Certificate } = require('crypto');

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
//
// PEMs can arrive with a trailing newline (files) or straight carriage
// returns (CRLF, common when a cert is copy-pasted on Windows). Node's TLS
// tolerates this, but normalizing keeps the cert clean so it always parses.
function normalizePem(value) {
  return value.replace(/\r\n/g, '\n').trim();
}

function readCaCert() {
  if (fs.existsSync('/etc/secrets/ca.pem')) {
    return normalizePem(fs.readFileSync('/etc/secrets/ca.pem', 'utf8'));
  }
  const envCert = process.env.DB_CA_CERT;
  if (envCert && envCert.trim()) {
    return normalizePem(envCert);
  }
  const certPath = process.env.DB_CA_CERT_PATH;
  if (certPath && fs.existsSync(certPath)) {
    return normalizePem(fs.readFileSync(certPath, 'utf8'));
  }
  return undefined;
}

function caCertSource() {
  if (fs.existsSync('/etc/secrets/ca.pem')) return 'Render secret file /etc/secrets/ca.pem';
  if (process.env.DB_CA_CERT && process.env.DB_CA_CERT.trim()) return 'env var DB_CA_CERT';
  if (process.env.DB_CA_CERT_PATH && fs.existsSync(process.env.DB_CA_CERT_PATH)) return 'env var DB_CA_CERT_PATH';
  return null;
}

const caCert = readCaCert();
const caSource = caCertSource();

if (caCert) {
  try {
    // Confirm the PEM is a real, parseable certificate BEFORE opening any
    // connections. A broken/mangled CA would otherwise fail later with an
    // opaque TLS error — this surfaces it at boot instead.
    new X509Certificate(caCert);
    console.info(`[db] MySQL TLS enabled — CA loaded from ${caSource}. rejectUnauthorized=true (verification ON).`);
  } catch (err) {
    console.error(`[db] FATAL: the CA certificate from ${caSource} is not a valid PEM certificate. Refusing to start. Check the cert content and re-add it.`);
    process.exit(1);
  }
} else {
  console.warn('[db] WARNING: no MySQL CA certificate configured. TLS verification disabled — Aiven connections will likely fail.');
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'tabulation_db',
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 20000,
    // Explicit rejectUnauthorized:true (mysql2's default anyway) — guarantees
    // the server certificate is verified against the CA above. No bypass.
    ...(caCert && { ssl: { ca: caCert, rejectUnauthorized: true } }),
});

module.exports = pool;