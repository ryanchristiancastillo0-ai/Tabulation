const HttpError = require('../utils/http-error');
const schoolService = require('../services/school.service');

exports.create = async (req, res) => {
  const result = await schoolService.createSchool(req.body);
  res.status(201).json(result);
};

exports.list = async (req, res) => {
  res.json(await schoolService.listSchools());
};

exports.getById = async (req, res) => {
  const id = req.params.id;
  if (!id) throw new HttpError(400, 'School id is required.');
  res.json(await schoolService.getSchoolById(id));
};

exports.update = async (req, res) => {
  const id = req.params.id;
  if (!id) throw new HttpError(400, 'School id is required.');
  res.json(await schoolService.updateSchool(id, req.body));
};

exports.updateJudgePassword = async (req, res) => {
  const id = req.params.id;
  if (!id) throw new HttpError(400, 'School id is required.');
  res.json(await schoolService.updateJudgePassword(id, req.body.judge_password));
};

exports.remove = async (req, res) => {
  const id = req.params.id;
  if (!id) throw new HttpError(400, 'School id is required.');
  res.json(await schoolService.deleteSchool(id));
};

// ── AUTHENTICATED PROFILE ENDPOINTS (use req.school_id from JWT) ──
exports.getProfile = async (req, res) => {
  res.json(await schoolService.getSchoolProfile(req.school_id));
};

exports.updateProfile = async (req, res) => {
  res.json(await schoolService.updateSchoolProfile(req.school_id, req.body));
};

exports.updateAdminPassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  res.json(await schoolService.updateAdminPassword(
    req.admin.admin_id,
    current_password,
    new_password
  ));
};

exports.updateProfileJudgePassword = async (req, res) => {
  res.json(await schoolService.updateJudgePassword(req.school_id, req.body.judge_password));
};