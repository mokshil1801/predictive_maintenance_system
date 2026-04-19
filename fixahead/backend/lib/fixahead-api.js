const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { connectToDatabase } = require("./mongodb");
const {
  CompletionLog,
  Alert,
  Prediction,
  Report,
  School,
  User,
  WorkOrder,
} = require("../models");
const { getJwtSecret } = require("../middleware/auth.middleware");
const { callMLModel } = require("../services/ml.service");
const { sendWhatsAppAlert } = require("../services/whatsapp.service");
const {
  calculateImpactScore,
  calculatePriorityScore,
  calculateUrgencyScore,
} = require("../utils/priority.util");
const { emitWorkflowEvent, workflowRooms } = require("../services/realtime.service");

const ACTIONABLE_STATUSES = ["awaiting_deo", "predicted", "reported", "pending", "delayed"];
const COMPLETED_STATUSES = ["completed", "verified"];

function jsonError(message, status = 400, code = "BAD_REQUEST") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toId(value) {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
}

function getAuthHeader(request) {
  if (!request) return "";
  if (typeof request.headers?.get === "function") {
    return request.headers.get("authorization") || "";
  }
  return request.headers?.authorization || "";
}

async function getUserFromRequest(request) {
  await connectToDatabase();
  const authorization = getAuthHeader(request);
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    throw jsonError("Authentication token is required.", 401, "AUTH_REQUIRED");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw jsonError("Authentication token is invalid or expired.", 401, "AUTH_INVALID");
  }

  const user = await User.findById(decoded.userId).select(
    "_id name email role assignedSchoolId district",
  );

  if (!user) {
    throw jsonError("Authenticated user was not found.", 401, "AUTH_INVALID");
  }

  return user;
}

function requireRole(user, roles) {
  if (!roles.includes(user.role)) {
    throw jsonError("You do not have access to this resource.", 403, "FORBIDDEN");
  }
}

function riskLevel(score) {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function calculateObservedRisk(input) {
  const conditionRisk = 100 - clamp(input.conditionScore);
  const toiletRisk = 100 - clamp(input.toiletFunctionality);
  const crackRisk = clamp((Number(input.crackWidth) / 8) * 100);
  const ageRisk = clamp((Number(input.buildingAge) / 50) * 100);
  const studentRisk = clamp((Number(input.totalStudents) / 500) * 100);
  const leakRisk = Number(input.waterLeak) >= 1 ? 100 : 0;
  const wiringRisk = Number(input.wiringExposed) >= 1 ? 100 : 0;
  const girlsSchoolRisk = Number(input.isGirlsSchool) >= 1 ? 15 : 0;

  const observed =
    conditionRisk * 0.2 +
    toiletRisk * 0.16 +
    crackRisk * 0.14 +
    ageRisk * 0.1 +
    studentRisk * 0.08 +
    leakRisk * 0.15 +
    wiringRisk * 0.15 +
    girlsSchoolRisk;

  return Math.round(clamp(observed));
}

function scaleRiskScore(rawRiskScore, input) {
  const raw = Number(rawRiskScore);
  let modelScore = Number.isFinite(raw) ? raw : 0;

  if (modelScore > 0 && modelScore <= 1) {
    modelScore *= 100;
  }

  const observedScore = calculateObservedRisk(input);
  const severeTriggers = [
    input.waterLeak >= 1 && input.toiletFunctionality <= 45,
    input.wiringExposed >= 1,
    input.crackWidth >= 5,
    input.conditionScore <= 35,
  ].filter(Boolean).length;

  let scaled = Math.max(modelScore, observedScore);

  if (severeTriggers >= 2) {
    scaled = Math.max(scaled, 91);
  } else if (severeTriggers === 1) {
    scaled = Math.max(scaled, 75);
  }

  console.log(
    `[ml] riskScore raw=${modelScore.toFixed(2)} observed=${observedScore} scaled=${Math.round(clamp(scaled))}`,
  );

  return Math.round(clamp(scaled));
}

function issueLabel(category) {
  const labels = {
    plumbing: "Toilet or water system failure risk",
    electrical: "Electrical safety failure risk",
    structural: "Structural deterioration risk",
  };
  return labels[category] || "Infrastructure failure risk";
}

function buildCriticalAlertMessage({ school, category, riskScore, failureWindowDays }) {
  return [
    "🚨 *Critical Infrastructure Alert*",
    "",
    `School: ${school.name}`,
    `Issue: ${issueLabel(category)}`,
    `Risk Score: ${riskScore}`,
    `Students Affected: ${school.totalStudents || 0}`,
    `Failure Expected In: ${failureWindowDays} Days`,
    "",
    "⚠ Immediate Action Required",
  ].join("\n");
}

async function sendCriticalRiskAlert({ school, prediction }) {
  if (Number(prediction.riskScore) <= 90) {
    return null;
  }

  const message = buildCriticalAlertMessage({
    school,
    category: prediction.category,
    riskScore: prediction.riskScore,
    failureWindowDays: prediction.failureWindowDays,
  });

  const deo = await User.findOne({
    role: "deo",
    district: school.district,
    phone: { $exists: true, $ne: null },
  }).sort({ createdAt: 1 });

  if (!deo) {
    console.warn(`[whatsapp] No DEO with phone found for district ${school.district}.`);
    return Alert.create({
      schoolId: school._id,
      predictionId: prediction._id,
      riskScore: prediction.riskScore,
      message,
      sentTo: "missing-deo-phone",
      status: "skipped",
      errorMessage: `No DEO phone found for district ${school.district}`,
    });
  }

  try {
    const response = await sendWhatsAppAlert(deo.phone, message);
    return Alert.create({
      schoolId: school._id,
      predictionId: prediction._id,
      riskScore: prediction.riskScore,
      message,
      sentTo: deo.phone,
      status: "sent",
      providerMessageId: response.sid,
    });
  } catch (error) {
    return Alert.create({
      schoolId: school._id,
      predictionId: prediction._id,
      riskScore: prediction.riskScore,
      message,
      sentTo: deo.phone,
      status: "failed",
      errorMessage: error.message,
    });
  }
}

function normalizeStatus(status) {
  return status === "pending" ? "awaiting_deo" : status;
}

function serializeSchool(school) {
  return {
    id: toId(school),
    name: school.name,
    district: school.district,
    buildingAge: school.buildingAge,
    materialType: school.materialType,
    weatherZone: school.weatherZone,
    totalStudents: school.totalStudents,
    isGirlsSchool: school.isGirlsSchool,
  };
}

async function resolvePrincipalSchool(user, requestedSchoolId = null) {
  if (user.role === "deo" && requestedSchoolId) {
    const school = await School.findById(requestedSchoolId);
    if (!school) {
      throw jsonError("Requested school was not found.", 404, "NOT_FOUND");
    }
    return school;
  }

  if (user.assignedSchoolId) {
    const assignedSchool = await School.findById(user.assignedSchoolId);
    if (assignedSchool) {
      return assignedSchool;
    }
  }

  const directlyLinkedSchool = await School.findOne({ principalId: user._id });
  if (directlyLinkedSchool) {
    if (!user.assignedSchoolId) {
      user.assignedSchoolId = directlyLinkedSchool._id;
      if (!user.district) {
        user.district = directlyLinkedSchool.district;
      }
      await user.save();
    }
    return directlyLinkedSchool;
  }

  const fallbackQuery = user.district ? { district: user.district } : {};
  const fallbackSchool = await School.findOne({
    ...fallbackQuery,
    $or: [{ principalId: null }, { principalId: { $exists: false } }],
  }).sort({ createdAt: 1, name: 1 });

  if (!fallbackSchool) {
    throw jsonError("No school is available to assign to this principal.", 400, "SCHOOL_REQUIRED");
  }

  fallbackSchool.principalId = user._id;
  await fallbackSchool.save();

  user.assignedSchoolId = fallbackSchool._id;
  if (!user.district) {
    user.district = fallbackSchool.district;
  }
  await user.save();

  return fallbackSchool;
}

function serializeQueueItem(prediction) {
  const school = prediction.schoolId || {};
  const report = prediction.reportId || {};
  const impactScore =
    prediction.impactScore ||
    calculateImpactScore({
      totalStudents: school.totalStudents,
      isGirlsSchool: school.isGirlsSchool,
      category: prediction.category,
    });
  const urgencyScore =
    prediction.urgencyScore || calculateUrgencyScore(prediction.failureWindowDays);
  const priorityScore =
    prediction.priorityScore ||
    calculatePriorityScore({
      riskScore: prediction.riskScore,
      impactScore,
      urgencyScore,
    });

  return {
    id: prediction._id.toString(),
    predictionId: prediction._id.toString(),
    reportId: toId(report),
    schoolId: toId(school),
    schoolName: school.name || "Unknown school",
    district: school.district || "Unassigned district",
    issue: issueLabel(prediction.category),
    category: prediction.category,
    riskScore: prediction.riskScore,
    risk: riskLevel(prediction.riskScore),
    impactScore,
    urgencyScore,
    priorityScore,
    studentImpact: `${school.totalStudents || 0} students affected`,
    failureWindowDays: prediction.failureWindowDays,
    failureWindow: `Within ${prediction.failureWindowDays} days`,
    reason: prediction.reason || [],
    status: normalizeStatus(prediction.status),
    createdAt: prediction.createdAt,
  };
}

function serializeWorkOrder(workOrder) {
  const prediction = workOrder.predictionId || {};
  const school = workOrder.schoolId || {};
  const contractor = workOrder.assignedTo || {};
  return {
    id: workOrder._id.toString(),
    workOrderId: workOrder._id.toString(),
    predictionId: toId(prediction),
    schoolId: toId(school),
    schoolName: school.name || "Unknown school",
    district: school.district || "Unassigned district",
    category: prediction.category || "infrastructure",
    issue: issueLabel(prediction.category),
    riskScore: prediction.riskScore || 0,
    priorityScore: workOrder.priorityScore || prediction.priorityScore || 0,
    reason: prediction.reason || [],
    status: workOrder.status,
    contractorName: contractor.name || "Assigned contractor",
    contractorId: toId(contractor),
    deadline: workOrder.deadline,
    assignedAt: workOrder.assignedAt,
    completedAt: workOrder.completedAt,
  };
}

async function saveUploadedFile(file, prefix) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return null;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const extension = path.extname(file.name || "") || ".jpg";
  const fileName = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
  const fullPath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  return `/uploads/${fileName}`;
}

async function getSchools() {
  await connectToDatabase();
  const schools = await School.find().sort({ district: 1, name: 1 });
  return schools.map(serializeSchool);
}

async function createReportFromRequest(request) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["peon", "principal", "deo"]);

  const formData = await request.formData();
  const schoolId = String(formData.get("schoolId") || user.assignedSchoolId || "");
  const school = await School.findById(schoolId);

  if (!school) {
    throw jsonError("Select a valid school before submitting the report.");
  }

  const category = String(formData.get("category") || "").toLowerCase();
  if (!["plumbing", "electrical", "structural"].includes(category)) {
    throw jsonError("Report category must be plumbing, electrical, or structural.");
  }

  const conditionScore = Number(formData.get("conditionScore"));
  const toiletFunctionality = Number(formData.get("toiletFunctionality"));
  if (!Number.isFinite(conditionScore) || conditionScore < 0 || conditionScore > 100) {
    throw jsonError("Condition score must be between 0 and 100.");
  }
  if (
    !Number.isFinite(toiletFunctionality) ||
    toiletFunctionality < 0 ||
    toiletFunctionality > 100
  ) {
    throw jsonError("Toilet functionality must be between 0 and 100.");
  }

  const file = formData.get("photo");
  const photoUrl = await saveUploadedFile(file, "report");
  const report = await Report.create({
    schoolId: school._id,
    submittedBy: user._id,
    weekStartDate: formData.get("weekStartDate") || new Date(),
    category,
    conditionScore,
    waterLeak: String(formData.get("waterLeak")) === "true",
    wiringExposed: String(formData.get("wiringExposed")) === "true",
    crackWidth: Number(formData.get("crackWidth") || 0),
    toiletFunctionality,
    photoUrl,
  });

  const mlInput = {
    conditionScore: report.conditionScore,
    waterLeak: report.waterLeak ? 1 : 0,
    wiringExposed: report.wiringExposed ? 1 : 0,
    crackWidth: report.crackWidth,
    toiletFunctionality: report.toiletFunctionality,
    buildingAge: school.buildingAge,
    totalStudents: school.totalStudents,
    isGirlsSchool: school.isGirlsSchool ? 1 : 0,
  };

  try {
    const ml = await callMLModel(mlInput);
    const riskScore = scaleRiskScore(ml.riskScore, mlInput);
    const failureWindowDays = Math.round(Number(ml.failureWindowDays));
    const impactScore = calculateImpactScore({
      totalStudents: school.totalStudents,
      isGirlsSchool: school.isGirlsSchool,
      category,
    });
    const urgencyScore = calculateUrgencyScore(failureWindowDays);
    const priorityScore = calculatePriorityScore({ riskScore, impactScore, urgencyScore });

    const prediction = await Prediction.create({
      reportId: report._id,
      schoolId: school._id,
      category,
      riskScore,
      failureWindowDays,
      impactScore,
      urgencyScore,
      priorityScore,
      reason: Array.isArray(ml.reason) && ml.reason.length ? ml.reason : ["ML risk signal generated"],
      status: "awaiting_deo",
    });

    await sendCriticalRiskAlert({ school, prediction });

    const rooms = workflowRooms({ schoolId: school._id });
    await emitWorkflowEvent("report:created", { reportId: report._id.toString(), schoolId }, rooms);
    await emitWorkflowEvent(
      "prediction:created",
      { prediction: serializeQueueItem(await prediction.populate(["schoolId", "reportId"])) },
      rooms,
    );
    await emitWorkflowEvent("priorityQueue:updated", { schoolId }, rooms);
    await emitWorkflowEvent("principalStatus:updated", { schoolId }, rooms);
    await emitWorkflowEvent("analytics:updated", { schoolId }, rooms);

    return {
      reportId: report._id.toString(),
      prediction: serializeQueueItem(prediction),
    };
  } catch (error) {
    await emitWorkflowEvent("report:created", { reportId: report._id.toString(), schoolId }, workflowRooms({ schoolId }));
    return {
      reportId: report._id.toString(),
      predictionStatus: "pending",
      mlError: error.message,
    };
  }
}

async function getPriorityQueue(request) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["deo"]);

  const predictions = await Prediction.find({ status: { $in: ACTIONABLE_STATUSES } })
    .populate("schoolId")
    .populate("reportId")
    .sort({ priorityScore: -1, riskScore: -1, createdAt: -1 })
    .limit(100);

  return predictions.map(serializeQueueItem);
}

async function getReportsForSchool(request, schoolId) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["principal", "deo"]);

  if (user.role === "principal" && toId(user.assignedSchoolId) !== schoolId) {
    throw jsonError("You can only view reports for your assigned school.", 403, "FORBIDDEN");
  }

  const reports = await Report.find({ schoolId }).sort({ createdAt: -1 }).limit(50);
  return reports.map((report) => ({
    id: report._id.toString(),
    category: report.category,
    conditionScore: report.conditionScore,
    waterLeak: report.waterLeak,
    wiringExposed: report.wiringExposed,
    crackWidth: report.crackWidth,
    toiletFunctionality: report.toiletFunctionality,
    photoUrl: report.photoUrl,
    createdAt: report.createdAt,
  }));
}

async function assignPrediction(request) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["deo"]);
  const body = await request.json();

  const prediction = await Prediction.findById(body.predictionId).populate("schoolId");
  if (!prediction) {
    throw jsonError("Prediction was not found.", 404, "NOT_FOUND");
  }

  if (!ACTIONABLE_STATUSES.includes(prediction.status)) {
    throw jsonError("This issue is already assigned or closed.", 409, "INVALID_STATUS");
  }

  const contractor = body.contractorId
    ? await User.findOne({ _id: body.contractorId, role: "contractor" })
    : (await User.findOne({ role: "contractor", district: prediction.schoolId.district }).sort({
        createdAt: 1,
      })) || (await User.findOne({ role: "contractor" }).sort({ createdAt: 1 }));
  if (!contractor) {
    throw jsonError("Select a valid contractor.", 400, "INVALID_CONTRACTOR");
  }

  const deadline = body.deadline ? new Date(body.deadline) : new Date(Date.now() + 48 * 60 * 60 * 1000);
  const workOrder = await WorkOrder.create({
    predictionId: prediction._id,
    schoolId: prediction.schoolId._id,
    assignedTo: contractor._id,
    assignedBy: user._id,
    status: "assigned",
    priorityScore: prediction.priorityScore,
    deadline,
  });

  console.log(
    `[assign] prediction=${prediction._id.toString()} school=${prediction.schoolId._id.toString()} contractor=${contractor._id.toString()} status=assigned`,
  );

  prediction.status = "assigned";
  await prediction.save();

  const populated = await WorkOrder.findById(workOrder._id)
    .populate("predictionId")
    .populate("schoolId")
    .populate("assignedTo");
  const rooms = workflowRooms({
    schoolId: prediction.schoolId._id,
    contractorId: contractor._id,
  });

  await emitWorkflowEvent("contractorTask:assigned", { task: serializeWorkOrder(populated) }, rooms);
  await emitWorkflowEvent("priorityQueue:updated", { predictionId: prediction._id.toString() }, rooms);
  await emitWorkflowEvent("principalStatus:updated", { schoolId: toId(prediction.schoolId) }, rooms);
  await emitWorkflowEvent("analytics:updated", { schoolId: toId(prediction.schoolId) }, rooms);

  return serializeWorkOrder(populated);
}

async function getPrincipalStatus(request) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["principal", "deo"]);
  const school = await resolvePrincipalSchool(
    user,
    request.nextUrl?.searchParams?.get("schoolId"),
  );
  const schoolId = school._id;

  const [predictions, workOrders, latestReport] = await Promise.all([
    Prediction.find({ schoolId }).populate("reportId").sort({ createdAt: -1 }).limit(50),
    WorkOrder.find({ schoolId })
      .populate("predictionId")
      .populate("assignedTo")
      .sort({ assignedAt: -1 })
      .limit(50),
    Report.findOne({ schoolId }).sort({ createdAt: -1 }),
  ]);

  const workByPrediction = new Map(workOrders.map((work) => [toId(work.predictionId), work]));
  const issues = predictions.map((prediction) => {
    const workOrder = workByPrediction.get(prediction._id.toString());
    return {
      id: prediction._id.toString(),
      schoolId: schoolId.toString(),
      category: prediction.category,
      issue: issueLabel(prediction.category),
      status: workOrder ? workOrder.status : normalizeStatus(prediction.status),
      risk: riskLevel(prediction.riskScore),
      riskScore: prediction.riskScore,
      priorityScore: prediction.priorityScore,
      failureWindowDays: prediction.failureWindowDays,
      reason: prediction.reason || [],
      contractorName: workOrder?.assignedTo?.name || null,
      assignedAt: workOrder?.assignedAt || null,
      deadline: workOrder?.deadline || null,
      completedAt: workOrder?.completedAt || null,
      reportedAt: prediction.createdAt,
    };
  });

  return {
    school: serializeSchool(school),
    latestReport: latestReport
      ? {
          id: latestReport._id.toString(),
          category: latestReport.category,
          conditionScore: latestReport.conditionScore,
          createdAt: latestReport.createdAt,
        }
      : null,
    issues,
  };
}

async function getContractorTasks(request) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["contractor"]);
  const tasks = await WorkOrder.find({
    assignedTo: user._id,
    status: { $ne: "completed" },
  })
    .populate("predictionId")
    .populate("schoolId")
    .populate("assignedTo")
    .sort({ status: 1, deadline: 1, assignedAt: -1 });

  console.log(`[contractor] user=${user._id.toString()} openTasks=${tasks.length}`);

  return tasks.map(serializeWorkOrder);
}

async function startWorkOrder(request, id) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["contractor"]);

  const workOrder = await WorkOrder.findOne({ _id: id, assignedTo: user._id })
    .populate("predictionId")
    .populate("schoolId")
    .populate("assignedTo");

  if (!workOrder) {
    throw jsonError("Task was not found.", 404, "NOT_FOUND");
  }

  workOrder.status = "in_progress";
  await workOrder.save();
  await Prediction.findByIdAndUpdate(toId(workOrder.predictionId), { status: "in_progress" });

  const rooms = workflowRooms({ schoolId: workOrder.schoolId._id, contractorId: user._id });
  await emitWorkflowEvent("contractorTask:started", { task: serializeWorkOrder(workOrder) }, rooms);
  await emitWorkflowEvent("principalStatus:updated", { schoolId: toId(workOrder.schoolId) }, rooms);
  await emitWorkflowEvent("analytics:updated", { schoolId: toId(workOrder.schoolId) }, rooms);

  return serializeWorkOrder(workOrder);
}

async function completeWorkOrder(request, id) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["contractor"]);
  const formData = await request.formData();

  const workOrder = await WorkOrder.findOne({ _id: id, assignedTo: user._id })
    .populate("predictionId")
    .populate("schoolId")
    .populate("assignedTo");

  if (!workOrder) {
    throw jsonError("Task was not found.", 404, "NOT_FOUND");
  }

  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw jsonError("GPS latitude and longitude are required before completion.");
  }

  const photoUrl = await saveUploadedFile(formData.get("photo"), "completion");
  if (!photoUrl) {
    throw jsonError("Completion photo is required.");
  }

  await CompletionLog.create({
    workOrderId: workOrder._id,
    photoUrl,
    gpsLocation: { latitude, longitude },
    remarks: String(formData.get("remarks") || ""),
  });

  workOrder.status = "completed";
  workOrder.completedAt = new Date();
  await workOrder.save();
  await Prediction.findByIdAndUpdate(toId(workOrder.predictionId), { status: "completed" });

  const rooms = workflowRooms({ schoolId: workOrder.schoolId._id, contractorId: user._id });
  await emitWorkflowEvent("contractorTask:completed", { task: serializeWorkOrder(workOrder) }, rooms);
  await emitWorkflowEvent("principalStatus:updated", { schoolId: toId(workOrder.schoolId) }, rooms);
  await emitWorkflowEvent("priorityQueue:updated", { schoolId: toId(workOrder.schoolId) }, rooms);
  await emitWorkflowEvent("analytics:updated", { schoolId: toId(workOrder.schoolId) }, rooms);

  return serializeWorkOrder(workOrder);
}

async function getDeoAnalytics(request) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["deo"]);

  const now = new Date();
  const [totalReports, highRiskCount, pendingAssignmentCount, inProgressRepairs, completedRepairs, overdueTasks, statusCounts, categoryCounts, weeklyReports] =
    await Promise.all([
      Report.countDocuments(),
      Prediction.countDocuments({ riskScore: { $gte: 70 } }),
      Prediction.countDocuments({ status: { $in: ACTIONABLE_STATUSES } }),
      WorkOrder.countDocuments({ status: "in_progress" }),
      WorkOrder.countDocuments({ status: { $in: COMPLETED_STATUSES } }),
      WorkOrder.countDocuments({ status: { $nin: COMPLETED_STATUSES }, deadline: { $lt: now } }),
      WorkOrder.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Prediction.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      Report.aggregate([
        {
          $group: {
            _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

  return {
    totalReports,
    highRiskCount,
    pendingAssignmentCount,
    inProgressRepairs,
    completedRepairs,
    slaBreaches: overdueTasks,
    charts: {
      statusDistribution: statusCounts.map((item) => ({ label: item._id, value: item.count })),
      categoryDistribution: categoryCounts.map((item) => ({ label: item._id, value: item.count })),
      weeklyReports: weeklyReports.map((item) => ({ label: item._id, value: item.count })),
    },
  };
}

async function getPrincipalAnalytics(request) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["principal", "deo"]);
  const school = await resolvePrincipalSchool(
    user,
    request.nextUrl?.searchParams?.get("schoolId"),
  );
  const schoolId = school._id.toString();

  const [schoolIssueCount, activeRepairs, resolvedRepairs, categoryRisk, conditionTrend] =
    await Promise.all([
      Prediction.countDocuments({ schoolId }),
      WorkOrder.countDocuments({ schoolId, status: { $in: ["assigned", "in_progress", "delayed"] } }),
      WorkOrder.countDocuments({ schoolId, status: { $in: COMPLETED_STATUSES } }),
      Prediction.aggregate([
        { $match: { schoolId: require("mongoose").Types.ObjectId.createFromHexString(schoolId) } },
        { $group: { _id: "$category", value: { $avg: "$riskScore" } } },
      ]),
      Report.find({ schoolId }).sort({ createdAt: 1 }).limit(12).select("conditionScore createdAt"),
    ]);

  return {
    schoolIssueCount,
    activeRepairs,
    resolvedRepairs,
    currentRiskOverview: categoryRisk.map((item) => ({
      label: item._id,
      value: Math.round(item.value),
    })),
    charts: {
      conditionTrend: conditionTrend.map((report) => ({
        label: report.createdAt.toISOString().slice(0, 10),
        value: report.conditionScore,
      })),
      categoryRisk: categoryRisk.map((item) => ({ label: item._id, value: Math.round(item.value) })),
    },
  };
}

async function getContractorAnalytics(request) {
  const user = await getUserFromRequest(request);
  requireRole(user, ["contractor"]);
  const now = new Date();
  const [assignedTasks, inProgressTasks, completedTasks, overdueTasks, workload] = await Promise.all([
    WorkOrder.countDocuments({ assignedTo: user._id, status: "assigned" }),
    WorkOrder.countDocuments({ assignedTo: user._id, status: "in_progress" }),
    WorkOrder.countDocuments({ assignedTo: user._id, status: { $in: COMPLETED_STATUSES } }),
    WorkOrder.countDocuments({
      assignedTo: user._id,
      status: { $nin: COMPLETED_STATUSES },
      deadline: { $lt: now },
    }),
    WorkOrder.aggregate([
      { $match: { assignedTo: user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    assignedTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    charts: {
      workload: workload.map((item) => ({ label: item._id, value: item.count })),
    },
  };
}

module.exports = {
  assignPrediction,
  completeWorkOrder,
  createReportFromRequest,
  getContractorAnalytics,
  getContractorTasks,
  getDeoAnalytics,
  getPrincipalAnalytics,
  getPrincipalStatus,
  getPriorityQueue,
  getReportsForSchool,
  getSchools,
  getUserFromRequest,
  jsonError,
  startWorkOrder,
};
