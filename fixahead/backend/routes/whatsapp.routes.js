const express = require("express");
const { sendWhatsAppAlert } = require("../services/whatsapp.service");

const router = express.Router();

router.post("/api/test-whatsapp", async (req, res) => {
  try {
    const message =
      req.body.message ||
      [
        "🚨 *Critical Infrastructure Alert*",
        "",
        "School: Govt School Ahmedabad",
        "Issue: Plumbing Failure Risk",
        "Risk Score: 92",
        "Students Affected: 120",
        "Failure Expected In: 15 Days",
        "",
        "⚠ Immediate Action Required",
      ].join("\n");

    const response = await sendWhatsAppAlert(req.body.phone, message);

    return res.status(200).json({
      success: true,
      message: "WhatsApp test alert sent successfully.",
      sid: response.sid,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to send WhatsApp test alert.",
    });
  }
});

module.exports = router;
