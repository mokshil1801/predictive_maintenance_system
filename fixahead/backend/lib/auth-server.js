const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("./mongodb");
const { School, User } = require("../models");
const { getJwtSecret } = require("../middleware/auth.middleware");

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  const value = String(phone || "").replace(/\s+/g, "").trim();
  if (!value) {
    return undefined;
  }

  if (value.includes("@")) {
    return undefined;
  }

  if (/^\+91\d{10}$/.test(value)) {
    return value;
  }

  if (/^\d{10}$/.test(value)) {
    return `+91${value}`;
  }

  const error = new Error("Phone number must be in +91XXXXXXXXXX format.");
  error.status = 400;
  throw error;
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    isVerified: user.isVerified,
    assignedSchoolId: user.assignedSchoolId ? user.assignedSchoolId.toString() : null,
    district: user.district || null,
  };
}

function signAuthToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email, phone: user.phone || null },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

async function registerAuthUser(payload) {
  await connectToDatabase();
  const { name, email, password, confirmPassword, role } = payload;
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(payload.phone);

  if (!name || !normalizedEmail || !password || !confirmPassword || !role) {
    const error = new Error("All registration fields are required.");
    error.status = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error("Enter a valid email address.");
    error.status = 400;
    throw error;
  }

  if (!["peon", "principal", "deo", "contractor"].includes(role)) {
    const error = new Error("Select a valid FixAhead role.");
    error.status = 400;
    throw error;
  }

  if (password !== confirmPassword) {
    const error = new Error("Passwords do not match.");
    error.status = 400;
    throw error;
  }

  if (!PASSWORD_REGEX.test(password)) {
    const error = new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    );
    error.status = 400;
    throw error;
  }

  const exists = await User.findOne({
    $or: [
      { email: normalizedEmail },
      ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
    ],
  });
  if (exists) {
    const error = new Error("An account with this email or phone already exists.");
    error.status = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role,
    isVerified: true,
  });

  if (role === "principal") {
    const school = await School.findOne({
      $or: [{ principalId: null }, { principalId: { $exists: false } }],
    }).sort({ createdAt: 1, name: 1 });

    if (school) {
      school.principalId = user._id;
      await school.save();
      user.assignedSchoolId = school._id;
      user.district = school.district;
      await user.save();
    }
  }

  return { message: "Registration successful. You can log in now." };
}

async function loginAuthUser(payload) {
  await connectToDatabase();
  const identifier = String(payload.identifier || payload.email || payload.phone || "").trim();
  const normalizedPhone = identifier ? normalizePhone(identifier) : undefined;
  const normalizedEmail = normalizeEmail(identifier);
  const user = await User.findOne({
    $or: [
      { email: normalizedEmail },
      ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
    ],
  }).select("+password");

  if (!user || !(await user.comparePassword(payload.password))) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  return {
    message: "Login successful.",
    token: signAuthToken(user),
    user: serializeUser(user),
  };
}

module.exports = {
  loginAuthUser,
  registerAuthUser,
  serializeUser,
  signAuthToken,
};
