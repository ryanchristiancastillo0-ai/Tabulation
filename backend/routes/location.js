const express = require("express");
const router = express.Router();

const PSGC_BASE = "https://psgc.gitlab.io/api";

router.get("/regions", async (req, res) => {
  try {
    const response = await fetch(`${PSGC_BASE}/regions/`);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error("Error fetching regions:", err.message);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});

router.get("/provinces/:regionCode", async (req, res) => {
  try {
    const { regionCode } = req.params;

    const response = await fetch(
      `${PSGC_BASE}/regions/${regionCode}/provinces`
    );

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error("Error fetching provinces:", err.message);
    res.status(500).json({ error: "Failed to fetch provinces" });
  }
});

// Add this route to your existing location.js
router.get("/cities/:provinceCode", async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const response = await fetch(
      `${PSGC_BASE}/provinces/${provinceCode}/cities-municipalities/`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching cities:", err.message);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

router.get("/barangays/:cityCode", async (req, res) => {
  try {
    const { cityCode } = req.params;

    const response = await fetch(
      `${PSGC_BASE}/cities-municipalities/${cityCode}/barangays`
    );

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error("Error fetching barangays:", err.message);
    res.status(500).json({ error: "Failed to fetch barangays" });
  }
});

module.exports = router;