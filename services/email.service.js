const nodemailer = require("nodemailer");

const APP_NAME = "FixAhead";
const BASE_URL = process.env.BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

let transporter;

function requireEmailConfig() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "Email service is not configured. Set EMAIL_USER and EMAIL_PASS with a Gmail App Password.",
    );
  }
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  requireEmailConfig();

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

function buildEmailTemplate({ title, preheader, body, ctaLabel, ctaUrl }) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0;background:#F9FAFB;font-family:Inter,Arial,sans-serif;color:#111827;">
        <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9FAFB;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E5E7EB;">
                <tr>
                  <td style="background:#0B6E4F;padding:28px 32px;color:#ffffff;">
                    <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#A7F3D0;font-weight:700;">FixAhead</div>
                    <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;font-weight:800;">${title}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <div style="font-size:16px;line-height:1.7;color:#374151;">${body}</div>
                    <div style="margin-top:28px;">
                      <a href="${ctaUrl}" style="display:inline-block;background:#0B6E4F;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:700;">
                        ${ctaLabel}
                      </a>
                    </div>
                    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6B7280;">
                      If the button does not work, open this link:<br />
                      <a href="${ctaUrl}" style="color:#0B6E4F;word-break:break-all;">${ctaUrl}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 32px;background:#ECFDF5;color:#065F46;font-size:13px;line-height:1.6;">
                    This email was sent by ${APP_NAME}, the predictive maintenance platform for school infrastructure.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function sendEmail(to, subject, html) {
  try {
    const mailTransporter = getTransporter();
    const info = await mailTransporter.sendMail({
      from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`[email] Sent "${subject}" to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}: ${error.message}`);

    if (
      error.code === "EAUTH" ||
      /Invalid login|Username and Password not accepted/i.test(error.message)
    ) {
      throw new Error(
        "Gmail SMTP authentication failed. Use EMAIL_PASS as a Google App Password, not your Gmail password.",
      );
    }

    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      throw new Error("Email service network connection failed. Check internet and SMTP access.");
    }

    throw error;
  }
}

async function verifyEmailConnection() {
  try {
    const mailTransporter = getTransporter();
    await mailTransporter.verify();
    console.log("[email] Gmail SMTP connection verified.");
    return true;
  } catch (error) {
    console.error(`[email] Gmail SMTP verification failed: ${error.message}`);
    throw error;
  }
}

async function sendPasswordResetEmail({ email, name, token }) {
  const resetLink = `${FRONTEND_URL}/reset-password/${token}`;
  const subject = "Reset your FixAhead password";
  const html = buildEmailTemplate({
    title: "Reset your FixAhead password",
    preheader: "Use this secure link to set a new FixAhead password.",
    body: `
      <p style="margin:0 0 14px;">Hello ${name},</p>
      <p style="margin:0 0 14px;">We received a request to reset your FixAhead password. Use the secure link below to create a new password.</p>
      <p style="margin:0;">This reset link expires in 1 hour. If you did not request this change, you can ignore this email.</p>
    `,
    ctaLabel: "Reset Password",
    ctaUrl: resetLink,
  });

  return sendEmail(email, subject, html);
}

module.exports = {
  buildEmailTemplate,
  sendEmail,
  sendPasswordResetEmail,
  verifyEmailConnection,
};
