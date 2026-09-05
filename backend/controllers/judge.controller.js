const judgeService = require('../services/judge.service');

exports.renderUI = async (req, res) => {
  res.json(await judgeService.renderUI(req.body));
};

exports.submit = async (req, res) => {
  res.json(await judgeService.submitScores(req.body));
};

exports.myScores = async (req, res) => {
  res.json(await judgeService.getMyScores(req.query.school_id, req.query.judgeId));
};

exports.myScoresRaw = async (req, res) => {
  res.json(await judgeService.getMyScoresRaw(req.query.school_id, req.params.judgeId));
};

exports.renderUICached = async (req, res) => {
  res.json(await judgeService.getCachedUI(req.query.school_id, req.query.criteria_signature));
};