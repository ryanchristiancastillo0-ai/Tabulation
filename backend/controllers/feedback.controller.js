// controllers/feedback.controller.js
const feedbackService = require('../services/feedback.service');

exports.send = async (req, res) => {
  try {
    const result = await feedbackService.sendFeedback(req.body);
    res.json(result);
  } catch (err) {
    console.error('[FEEDBACK ERROR]', err);
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
  }
};