const express = require("express");

const { createReport } = require("../controllers/report.controller");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/api/report", upload.single("photo"), createReport);

module.exports = router;
