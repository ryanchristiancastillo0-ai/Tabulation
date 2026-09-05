const HttpError = require('../utils/http-error');
const dataService = require('../services/data.service');

// ── PUBLIC ROUTES ──
exports.publicSystemConfig = async (req, res) => {
  const school_id = req.query.school_id;
  if (!school_id) throw new HttpError(400, 'school_id query param required.');
  res.json(await dataService.getSystemConfig(school_id));
};

exports.publicGetAllData = async (req, res) => {
  const school_id = req.query.school_id;
  if (!school_id) throw new HttpError(400, 'school_id query param required.');
  res.json(await dataService.getAllData(school_id));
};

exports.publicLeaderboard = async (req, res) => {
  const school_id = req.query.school_id;
  if (!school_id) throw new HttpError(400, 'school_id query param required.');
  const result = await dataService.computeLeaderboard(school_id);
  res.json(result ?? []);
};

exports.publicJudgeIds = async (req, res) => {
  const school_id = req.query.school_id;
  if (!school_id) throw new HttpError(400, 'school_id query param required.');
  res.json(await dataService.getJudgeIds(school_id));
};

exports.publicJudgeScores = async (req, res) => {
  const school_id = req.query.school_id;
  const judgeId   = req.query.judgeId;
  if (!school_id) throw new HttpError(400, 'school_id query param required.');
  if (!judgeId)   throw new HttpError(400, 'judgeId query param required.');
  res.json(await dataService.getJudgeScores(school_id, judgeId));
};

// ── PROTECTED ROUTES (auth via middleware) ──
exports.getAllData = async (req, res) => {
  res.json(await dataService.getAllData(req.school_id));
};

exports.leaderboard = async (req, res) => {
  const result = await dataService.computeLeaderboard(req.school_id);
  if (result === null) throw new HttpError(404, 'No settings found for this school.');
  res.json(result);
};

exports.judgeIds = async (req, res) => {
  res.json(await dataService.getJudgeIds(req.school_id));
};

exports.judgeMyScores = async (req, res) => {
  const judgeId = req.query.judgeId;
  if (!judgeId) throw new HttpError(400, 'judgeId query param required.');
  res.json(await dataService.getJudgeScores(req.school_id, judgeId));
};

exports.resetData = async (req, res) => {
  res.json(await dataService.resetData(req.school_id));
};

exports.saveConfig = async (req, res) => {
  res.json(await dataService.saveConfig(req.school_id, req.body));
};

exports.systemConfig = async (req, res) => {
  res.json(await dataService.getSystemConfig(req.school_id));
};

exports.saveSystemConfig = async (req, res) => {
  res.json(await dataService.saveSystemConfig(req.school_id, req.body));
};