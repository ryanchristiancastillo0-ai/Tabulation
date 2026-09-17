const authService = require('../services/auth.service');

exports.login = async (req, res) => {
  res.json(await authService.login(req.body));
};

exports.judgeLogin = async (req, res) => {
  res.json(await authService.judgeLogin(req.body));
};

exports.refresh = async (req, res) => {
  res.json(await authService.refreshSession(req.body));
};

exports.presence = async (req, res) => {
  res.json(await authService.touchPresence(req.body));
};

exports.logout = async (req, res) => {
  res.json(await authService.logout(req.body));
};

exports.requestPasswordReset = async (req, res) => {
  res.json(await authService.requestPasswordReset(req.body));
};

exports.verifyResetCode = async (req, res) => {
  res.json(await authService.verifyResetCode(req.body));
};

exports.resetPassword = async (req, res) => {
  res.json(await authService.resetPassword(req.body));
};