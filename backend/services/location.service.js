const { fetchPSGC } = require('../utils/psgc');
const HttpError = require('../utils/http-error');

async function getRegions() {
  try {
    return await fetchPSGC('/api/regions/');
  } catch (err) {
    console.error('Error fetching regions:', err.message);
    throw new HttpError(500, 'Failed to fetch regions');
  }
}

async function getProvinces(regionCode) {
  try {
    return await fetchPSGC(`/api/regions/${regionCode}/provinces/`);
  } catch (err) {
    console.error('Error fetching provinces:', err.message);
    throw new HttpError(500, 'Failed to fetch provinces');
  }
}

async function getCities(provinceCode) {
  try {
    return await fetchPSGC(`/api/provinces/${provinceCode}/cities-municipalities/`);
  } catch (err) {
    console.error('Error fetching cities:', err.message);
    throw new HttpError(500, 'Failed to fetch cities');
  }
}

async function getBarangays(cityCode) {
  try {
    return await fetchPSGC(`/api/cities-municipalities/${cityCode}/barangays/`);
  } catch (err) {
    console.error('Error fetching barangays:', err.message);
    throw new HttpError(500, 'Failed to fetch barangays');
  }
}

module.exports = { getRegions, getProvinces, getCities, getBarangays };