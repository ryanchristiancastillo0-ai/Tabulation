const judgeService = require('../services/judge.service');
const { touchSchoolActivity } = require('../utils/activity');

// ── JUDGE-CONTROLLER (PROTECTED BY requireJudge) ──
// school_id comes from the verified JWT (req.school_id), NOT from the request
// body/query. A judge can therefore only ever read/write their own school's data.

exports.submit = async (req, res) => {
  touchSchoolActivity(req.school_id);
  // Ignore any school_id the client sends — the token is authoritative.
  const { judgeId, scores } = req.body || {};
  res.json(await judgeService.submitScores({ judgeId, scores, school_id: req.school_id }));
};

exports.myScores = async (req, res) => {
  touchSchoolActivity(req.school_id);
  res.json(await judgeService.getMyScores(req.school_id, req.query.judgeId));
};

exports.myScoresRaw = async (req, res) => {
  touchSchoolActivity(req.school_id);
  res.json(await judgeService.getMyScoresRaw(req.school_id, req.params.judgeId));
};

exports.renderUICached = async (req, res) => {
  touchSchoolActivity(req.school_id);
  res.json(await judgeService.getCachedUI(req.school_id, req.query.criteria_signature));
};