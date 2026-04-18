const express = require("express");

const { createReport } = require("../controllers/report.controller");

const router = express.Router();

router.post("/api/report", createReport);

module.exports = router;
