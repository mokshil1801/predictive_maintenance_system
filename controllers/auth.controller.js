const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { School, User } = require("../models");
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../services/email.service");
const { getJwtSecret } = require("../middleware/auth.middleware");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
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

  if (/^\+91\d{10}$/.test(value)) {
    return value;
  }

  if (/^\d{10}$/.test(value)) {
    return `+91${value}`;
  }

  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return PASSWORD_REGEX.test(String(password || ""));
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createPlainToken() {
  return crypto.randomBytes(32).toString("hex");
}

function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      phone: user.phone || null,
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
    phone: user.phone || null,
    role: user.role,
    isVerified: user.isVerified,
    assignedSchoolId: user.assignedSchoolId,
    district: user.district,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword, role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(req.body.phone);

    if (!name || !normalizedEmail || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All registration fields are required." });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (normalizedPhone === null) {
      return res.status(400).json({ message: "Phone number must be in +91XXXXXXXXXX format." });
    }

    if (!["peon", "principal", "deo", "contractor"].includes(role)) {
      return res.status(400).json({ message: "Select a valid FixAhead role." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email or phone already exists." });
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

    return res.status(201).json({
      message: "Registration successful. You can log in now.",
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { password } = req.body;
    const identifier = String(req.body.identifier || req.body.email || req.body.phone || "").trim();
    const normalizedEmail = normalizeEmail(identifier);
    const normalizedPhone = normalizePhone(identifier);

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email or phone and password are required." });
    }

    if ((identifier.startsWith("+") || /^\d+$/.test(identifier)) && normalizedPhone === null) {
      return res.status(400).json({ message: "Phone number must be in +91XXXXXXXXXX format." });
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signAuthToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const hashedToken = hashToken(req.params.token);
    const user = await User.findOne({ verificationToken: hashedToken }).select(
      "+verificationToken",
    );

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?verified=invalid`);
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return res.redirect(`${FRONTEND_URL}/login?verified=1`);
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+resetPasswordToken +resetPasswordExpires",
    );

    if (!user) {
      return res.status(200).json({
        message: "If the email exists, a password reset link has been sent.",
      });
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

    return res.status(200).json({
      message: "If the email exists, a password reset link has been sent.",
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "Token and passwords are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired." });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      message: "Password updated successfully. You can now log in.",
    });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    return res.status(200).json({
      user: serializeUser(req.authenticatedUser),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
