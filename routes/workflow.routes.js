const express = require("express");

const {
  assign,
  completeTask,
  contractorAnalytics,
  contractorTasks,
  deoAnalytics,
  principalAnalytics,
  principalStatus,
  priorityQueue,
  startTask,
} = require("../controllers/workflow.controller");
const { checkAuth, checkRole } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.get("/api/deo/priority-queue", priorityQueue);
router.post("/api/deo/assign", assign);
router.get("/api/principal/current-status", principalStatus);
router.get("/api/contractor/tasks", contractorTasks);
router.patch("/api/contractor/task/:id/start", startTask);
router.patch(
  "/api/contractor/task/:id/complete",
  checkAuth,
  checkRole("contractor"),
  upload.single("photo"),
  completeTask,
);
router.get("/api/analytics/deo", deoAnalytics);
router.get("/api/analytics/principal", principalAnalytics);
router.get("/api/analytics/contractor", contractorAnalytics);

module.exports = router;
