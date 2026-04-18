const nodemailer = require("nodemailer");

const APP_NAME = "FixAhead";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || FRONTEND_URL;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@fixahead.local";

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });

    return transporter;
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });

  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const mailTransporter = getTransporter();
  const info = await mailTransporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  return info;
}

async function sendVerificationEmail({ email, name, token }) {
  const verificationLink = `${BACKEND_URL}/api/auth/verify/${token}`;
  const subject = `${APP_NAME} email verification`;
  const text = `Hello ${name}, verify your FixAhead account by opening: ${verificationLink}`;
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="color: #0B6E4F;">Verify your FixAhead account</h2>
      <p>Hello ${name},</p>
      <p>Confirm your email to start reporting and monitoring school infrastructure issues.</p>
      <p>
        <a href="${verificationLink}" style="display:inline-block; background:#0B6E4F; color:#ffffff; padding:12px 20px; border-radius:12px; text-decoration:none; font-weight:600;">
          Verify email
        </a>
      </p>
      <p>If the button does not work, use this link:</p>
      <p>${verificationLink}</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html, text });
}

async function sendPasswordResetEmail({ email, name, token }) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
  const subject = `${APP_NAME} password reset`;
  const text = `Hello ${name}, reset your FixAhead password here: ${resetLink}`;
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="color: #0B6E4F;">Reset your FixAhead password</h2>
      <p>Hello ${name},</p>
      <p>Use the link below to set a new password for your account.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block; background:#0B6E4F; color:#ffffff; padding:12px 20px; border-radius:12px; text-decoration:none; font-weight:600;">
          Reset password
        </a>
      </p>
      <p>This link expires in 1 hour.</p>
      <p>If the button does not work, use this link:</p>
      <p>${resetLink}</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html, text });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
