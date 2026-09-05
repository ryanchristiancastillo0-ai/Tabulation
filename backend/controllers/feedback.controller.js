const feedbackService = require('../services/feedback.service');

exports.send = async (req, res) => {
  res.json(await feedbackService.sendFeedback(req.body));
};