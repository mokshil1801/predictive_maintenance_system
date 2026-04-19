const express = require("express");

const {
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resetPassword,
  verifyEmail,
} = require("../controllers/auth.controller");
const { checkAuth, checkRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/api/auth/register", register);
router.post("/api/auth/login", login);
router.get("/api/auth/verify/:token", verifyEmail);
router.post("/api/auth/forgot-password", forgotPassword);
router.post("/api/auth/reset-password", resetPassword);
router.get("/api/auth/me", checkAuth, getCurrentUser);

router.get("/api/auth/peon-only", checkAuth, checkRole("peon"), (req, res) => {
  res.status(200).json({ message: "Peon access granted." });
});

module.exports = router;
