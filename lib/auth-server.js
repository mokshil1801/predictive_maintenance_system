const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { connectToDatabase } = require("./mongodb");
const { User } = require("../models");
const {
  buildEmailTemplate,
  sendEmail,
  sendPasswordResetEmail,
} = require("../services/email.service");

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const ROLES = ["peon", "principal", "deo", "contractor"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return PASSWORD_REGEX.test(String(password || ""));
}

function createPlainToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getJwtSecret() {
  return process.env.JWT_SECRET || "fixahead-dev-secret";
}

function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    assignedSchoolId: user.assignedSchoolId || null,
    district: user.district || null,
  };
}

function makeHttpError(status, message, details = {}) {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, details);
  return error;
}

async function registerUser(payload) {
  await connectToDatabase();

  const { name, email, password, confirmPassword, role } = payload || {};
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password || !confirmPassword || !role) {
    throw makeHttpError(400, "All registration fields are required.");
  }

  if (!isValidEmail(normalizedEmail)) {
    throw makeHttpError(400, "Enter a valid email address.");
  }

  if (!ROLES.includes(role)) {
    throw makeHttpError(400, "Select a valid FixAhead role.");
  }

  if (password !== confirmPassword) {
    throw makeHttpError(400, "Passwords do not match.");
  }

  if (!isStrongPassword(password)) {
    throw makeHttpError(
      400,
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    );
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw makeHttpError(409, "An account with this email already exists.");
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiresAt: null,
  });

  return {
    message: "Registration successful. You can now log in.",
  };
}

async function loginUser(payload) {
  await connectToDatabase();

  const normalizedEmail = normalizeEmail(payload?.email);
  const password = payload?.password;

  if (!normalizedEmail || !password) {
    throw makeHttpError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw makeHttpError(401, "Invalid email or password.");
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw makeHttpError(401, "Invalid email or password.");
  }

  return {
    message: "Login successful.",
    token: signAuthToken(user),
    user: serializeUser(user),
  };
}

async function forgotPassword(payload) {
  await connectToDatabase();

  const normalizedEmail = normalizeEmail(payload?.email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw makeHttpError(400, "Enter a valid email address.");
  }

  const genericMessage = {
    message: "If the email exists, a password reset link has been sent.",
  };

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+resetPasswordToken +resetPasswordExpires",
  );

  if (!user) {
    return genericMessage;
  }

  const resetToken = createPlainToken();
  user.resetPasswordToken = hashToken(resetToken);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  await sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    token: resetToken,
  });

  return genericMessage;
}

async function resetPassword(payload) {
  await connectToDatabase();

  const { token, password, confirmPassword } = payload || {};

  if (!token || !password || !confirmPassword) {
    throw makeHttpError(400, "Token and passwords are required.");
  }

  if (password !== confirmPassword) {
    throw makeHttpError(400, "Passwords do not match.");
  }

  if (!isStrongPassword(password)) {
    throw makeHttpError(
      400,
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    );
  }

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires +password");

  if (!user) {
    throw makeHttpError(400, "Reset link is invalid or expired.");
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return {
    message: "Password updated successfully. You can now log in.",
  };
}

async function sendTestEmail(payload) {
  const to = normalizeEmail(payload?.to);

  if (!to || !isValidEmail(to)) {
    throw makeHttpError(400, "A valid recipient email is required.");
  }

  const html = buildEmailTemplate({
    title: "FixAhead email test",
    preheader: "Your FixAhead Gmail SMTP setup is working.",
    body: `
      <p style="margin:0 0 14px;">This is a test email from FixAhead.</p>
      <p style="margin:0;">If you received this message, Gmail SMTP is configured correctly.</p>
    `,
    ctaLabel: "Open FixAhead",
    ctaUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  });

  await sendEmail(to, "FixAhead email test", html);

  return {
    message: "Test email sent successfully.",
  };
}

module.exports = {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  sendTestEmail,
};
