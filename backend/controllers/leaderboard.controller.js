const leaderboardService = require('../services/leaderboard.service');

exports.get = async (req, res) => {
  res.json(await leaderboardService.getFullscreenConfig(req.query.school_id));
};

exports.save = async (req, res) => {
  res.json(await leaderboardService.saveFullscreenConfig(req.body));
};