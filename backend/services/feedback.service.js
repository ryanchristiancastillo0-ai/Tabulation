const HttpError = require('../utils/http-error');
const { sendFeedbackEmail } = require('../utils/email');

async function sendFeedback({ name, email, message }) {
  if (!name || !email || !message) {
    throw new HttpError(400, 'All fields are required.');
  }

  try {
    await sendFeedbackEmail({ name, email, message });
  } catch (err) {
    console.error('💥 Failed to send feedback email:', err);
    throw new HttpError(500, 'Failed to send feedback. Please try again.');
  }

  return { success: true, message: 'Feedback sent successfully.' };
}

module.exports = { sendFeedback };