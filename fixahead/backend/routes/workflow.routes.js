const express = require("express");
const {
  assign,
  contractorAnalytics,
  contractorTasks,
  completeTask,
  deoAnalytics,
  principalAnalytics,
  principalStatus,
  priorityQueue,
  startTask,
} = require("../controllers/workflow.controller");
const { checkAuth, checkRole } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");

const router = express.Router();

router.get("/api/deo/priority-queue", checkAuth, checkRole("deo"), priorityQueue);
router.post("/api/deo/assign", checkAuth, checkRole("deo"), assign);

router.get(
  "/api/principal/current-status",
  checkAuth,
  checkRole("principal", "deo"),
  principalStatus,
);

router.get("/api/contractor/tasks", checkAuth, checkRole("contractor"), contractorTasks);
router.patch("/api/contractor/task/:id/start", checkAuth, checkRole("contractor"), startTask);
router.patch(
  "/api/contractor/task/:id/complete",
  checkAuth,
  checkRole("contractor"),
  upload.single("photo"),
  completeTask,
);

router.get("/api/analytics/deo", checkAuth, checkRole("deo"), deoAnalytics);
router.get(
  "/api/analytics/principal",
  checkAuth,
  checkRole("principal", "deo"),
  principalAnalytics,
);
router.get("/api/analytics/contractor", checkAuth, checkRole("contractor"), contractorAnalytics);

module.exports = router;
