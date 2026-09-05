const locationService = require('../services/location.service');

exports.regions = async (req, res) => {
  res.json(await locationService.getRegions());
};

exports.provinces = async (req, res) => {
  res.json(await locationService.getProvinces(req.params.regionCode));
};

exports.cities = async (req, res) => {
  res.json(await locationService.getCities(req.params.provinceCode));
};

exports.barangays = async (req, res) => {
  res.json(await locationService.getBarangays(req.params.cityCode));
};