const jwt = require("jsonwebtoken");

const { User } = require("../models");

function getJwtSecret() {
  return process.env.JWT_SECRET || "fixahead-dev-secret";
}

async function checkAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required." });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.userId).select(
      "_id name email role isVerified assignedSchoolId district",
    );

    if (!user) {
      return res.status(401).json({ message: "Authentication token is invalid." });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      isVerified: user.isVerified,
    };
    req.authenticatedUser = user;

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication token is invalid or expired." });
  }
}

function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication is required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this resource." });
    }

    return next();
  };
}

module.exports = {
  checkAuth,
  checkRole,
  getJwtSecret,
};
