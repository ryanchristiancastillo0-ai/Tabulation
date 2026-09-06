function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emailShell({ eyebrow, title, body, footer }) {
  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 14px; background-color: #FBFCF9; padding: 24px;">
      <table role="presentation" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E1E8DE; border-radius: 4px; overflow: hidden;">
        <tr>
          <td style="background-color: #1B4332; padding: 20px 24px;">
            <div style="width: 40px; height: 3px; background-color: #C9A227; margin-bottom: 12px;"></div>
            <div style="display: inline-block; padding: 4px 10px; background-color: rgba(255,255,255,0.1); color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.2);">
              ${eyebrow}
            </div>
            <div style="font-family: Georgia, serif; color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 10px;">
              ${title}
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding: 24px;">${body}</td>
        </tr>

        <tr>
          <td style="background-color: #F3F6F1; padding: 14px 24px; text-align: center; border-top: 1px solid #E1E8DE;">
            <div style="font-size: 11px; color: #6C7A71;">${footer}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

async function sendEmail({ to, subject, html, replyTo }) {
  const payload = {
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: [to],
    subject,
    html,
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

async function sendPasswordResetEmail(toEmail, code) {
  const html = emailShell({
    eyebrow: 'Security',
    title: 'Password Reset Request',
    body: `
      <div style="color: #4B5A4D; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
        A password reset was requested for your administrator account.
        Use the verification code below to continue. This code expires in
        <strong style="color: #14201A;">10 minutes</strong>.
      </div>

      <div style="text-align: center; padding: 18px; background-color: #F3F6F1; border: 1px dashed #BBCABB; border-radius: 4px; letter-spacing: 8px; font-size: 26px; font-weight: 700; color: #1B4332;">
        ${code}
      </div>

      <div style="margin-top: 20px; font-size: 12px; color: #6C7A71; line-height: 1.6;">
        If you did not request this, you can safely ignore this email.
        Never share this code with anyone.
      </div>
    `,
    footer: 'Secure Account Recovery',
  });

  await sendEmail({ to: toEmail, subject: 'Your Password Reset Code', html });
}

async function sendFeedbackEmail({ name, email, message }) {
  const time = new Date().toLocaleString();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  const html = emailShell({
    eyebrow: 'New Feedback',
    title: 'A Message Has Arrived',
    body: `
      <div style="color: #4B5A4D; font-size: 13px; margin-bottom: 20px;">
        A message by <strong style="color: #14201A;">${safeName}</strong> has been received. Kindly respond at your earliest convenience.
      </div>

      <table role="presentation" width="100%" style="border-top: 1px dashed #E1E8DE; border-bottom: 1px dashed #E1E8DE; padding: 15px 0;">
        <tr>
          <td width="50" style="vertical-align: top; padding: 15px 0;">
            <div
              role="img"
              style="
                width: 40px;
                height: 40px;
                padding: 6px;
                background-color: #F3F6F1;
                border: 1px solid #BBCABB;
                border-radius: 5px;
                font-size: 22px;
                text-align: center;
              "
            >
              👤
            </div>
          </td>
          <td style="vertical-align: top; padding: 15px 0 15px 12px;">
            <div style="color: #14201A; font-size: 15px; font-weight: 700;">
              ${safeName}
            </div>
            <div style="color: #6C7A71; font-size: 12px; margin-top: 2px;">${time}</div>
            <div style="color: #6C7A71; font-size: 12px; margin-top: 2px;">${safeEmail}</div>
            <p style="font-size: 14px; color: #14201A; margin: 10px 0 0 0; line-height: 1.5;">${safeMessage}</p>
          </td>
        </tr>
      </table>

      <div style="margin-top: 20px; font-size: 12px; color: #6C7A71;">
        Reply directly to this email to respond to ${safeName}.
      </div>
    `,
    footer: 'Feedback System',
  });

  await sendEmail({
    to: process.env.RECEIVER_EMAIL,
    replyTo: email,
    subject: 'New Feedback Message',
    html,
  });
}

module.exports = { sendEmail, emailShell, sendPasswordResetEmail, sendFeedbackEmail };