const express = require("express");
const https = require("https");
const router = express.Router();

const PSGC_HOST = "psgc.gitlab.io";
const TIMEOUT_MS = 8000;

function fetchPSGC(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: PSGC_HOST,
      path,
      method: "GET",
      headers: { Accept: "application/json" },
      family: 4, // force IPv4 — fixes most "fetch failed / AggregateError" issues on Windows
      timeout: TIMEOUT_MS,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); // discard response data
        return reject(
          new Error(`PSGC API responded with ${res.statusCode} for ${path}`)
        );
      }

      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(
            new Error(`Failed to parse JSON from ${path}: ${err.message}`)
          );
        }
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Request to ${path} timed out after ${TIMEOUT_MS}ms`));
    });

    req.on("error", (err) => {
      reject(new Error(`Request to ${path} failed: ${err.message}`));
    });

    req.end();
  });
}

router.get("/regions", async (req, res) => {
  try {
    const data = await fetchPSGC("/api/regions/");
    res.json(data);
  } catch (err) {
    console.error("Error fetching regions:", err.message);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});

router.get("/provinces/:regionCode", async (req, res) => {
  try {
    const { regionCode } = req.params;
    const data = await fetchPSGC(`/api/regions/${regionCode}/provinces/`);
    res.json(data);
  } catch (err) {
    console.error("Error fetching provinces:", err.message);
    res.status(500).json({ error: "Failed to fetch provinces" });
  }
});

router.get("/cities/:provinceCode", async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const data = await fetchPSGC(
      `/api/provinces/${provinceCode}/cities-municipalities/`
    );
    res.json(data);
  } catch (err) {
    console.error("Error fetching cities:", err.message);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

router.get("/barangays/:cityCode", async (req, res) => {
  try {
    const { cityCode } = req.params;
    const data = await fetchPSGC(
      `/api/cities-municipalities/${cityCode}/barangays/`
    );
    res.json(data);
  } catch (err) {
    console.error("Error fetching barangays:", err.message);
    res.status(500).json({ error: "Failed to fetch barangays" });
  }
});

module.exports = router;