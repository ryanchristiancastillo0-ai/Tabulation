const authService = require('../services/auth.service');

exports.login = async (req, res) => {
  res.json(await authService.login(req.body));
};

exports.resetPassword = async (req, res) => {
  res.json(await authService.resetPassword(req.body));
};