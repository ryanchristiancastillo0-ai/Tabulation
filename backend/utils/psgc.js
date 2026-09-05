const https = require('https');

const PSGC_HOST  = 'psgc.gitlab.io';
const TIMEOUT_MS = 8000;

function fetchPSGC(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: PSGC_HOST,
      path,
      method: 'GET',
      headers: { Accept: 'application/json' },
      family: 4, // force IPv4 — fixes most "fetch failed / AggregateError" issues on Windows
      timeout: TIMEOUT_MS,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); // discard response data
        return reject(new Error(`PSGC API responded with ${res.statusCode} for ${path}`));
      }

      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`Failed to parse JSON from ${path}: ${err.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Request to ${path} timed out after ${TIMEOUT_MS}ms`));
    });

    req.on('error', (err) => {
      reject(new Error(`Request to ${path} failed: ${err.message}`));
    });

    req.end();
  });
}

module.exports = { fetchPSGC };