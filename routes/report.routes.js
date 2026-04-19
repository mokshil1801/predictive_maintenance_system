const express = require("express");

const { createReport } = require("../controllers/report.controller");
const { checkAuth, checkRole } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");

const router = express.Router();

router.post(
  "/api/report",
  checkAuth,
  checkRole("peon", "principal", "deo"),
  upload.single("photo"),
  createReport,
);

module.exports = router;
