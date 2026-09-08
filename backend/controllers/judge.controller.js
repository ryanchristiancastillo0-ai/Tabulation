const judgeService = require('../services/judge.service');
const { touchSchoolActivity } = require('../utils/activity');

exports.submit = async (req, res) => {
  touchSchoolActivity(req.body && req.body.school_id);
  res.json(await judgeService.submitScores(req.body));
};

exports.myScores = async (req, res) => {
  touchSchoolActivity(req.query.school_id);
  res.json(await judgeService.getMyScores(req.query.school_id, req.query.judgeId));
};

exports.myScoresRaw = async (req, res) => {
  touchSchoolActivity(req.query.school_id);
  res.json(await judgeService.getMyScoresRaw(req.query.school_id, req.params.judgeId));
};

exports.renderUICached = async (req, res) => {
  touchSchoolActivity(req.query.school_id);
  res.json(await judgeService.getCachedUI(req.query.school_id, req.query.criteria_signature));
};