const fs = require("fs/promises");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const { connectToDatabase } = require("./mongodb");
const { getJwtSecret } = require("../middleware/auth.middleware");
const { callMLModel } = require("../services/ml.service");
const {
  emitWorkflowEvent,
  workflowRooms,
} = require("../services/realtime.service");
const { CompletionLog, Prediction, Report, School, User, WorkOrder } = require("../models");
const {
  calculateImpactScore,
  calculatePriorityScore,
  calculateUrgencyScore,
} = require("../utils/priority.util");

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toBoolean(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeCategory(value) {
  const category = String(value || "").trim().toLowerCase();
  if (["plumbing", "electrical", "structural"].includes(category)) {
    return category;
  }

  return "";
}

function categoryLabel(category) {
  return String(category || "").charAt(0).toUpperCase() + String(category || "").slice(1);
}

function riskTone(score) {
  if (score >= 88) return "critical";
  if (score >= 72) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function issueTitle(category, report = {}) {
  if (category === "plumbing") {
    return report.toiletFunctionality < 55
      ? "Toilet failure risk"
      : "Water leakage detected";
  }

  if (category === "electrical") {
    return report.wiringExposed
      ? "Electrical wiring exposed"
      : "Electrical inspection required";
  }

  return report.crackWidth >= 4
    ? "Structural crack progression"
    : "Structural monitoring required";
}

function makeHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getUserFromRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    throw makeHttpError(401, "Authentication token is required.");
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw makeHttpError(401, "Authenticated user was not found.");
    }
    return user;
  } catch (error) {
    if (error.status) throw error;
    throw makeHttpError(401, "Invalid or expired authentication token.");
  }
}

function requireRole(user, roles) {
  if (!roles.includes(user.role)) {
    throw makeHttpError(403, "You do not have permission to perform this action.");
  }
}

async function saveUpload(file, prefix) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return null;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const extension = path.extname(file.name || "") || ".jpg";
  const fileName = `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}${extension}`.replace(/[^a-zA-Z0-9._-]/g, "-");
  const filePath = path.join(UPLOAD_DIR, fileName);
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${fileName}`;
}

function serializeSchool(school) {
  return {
    id: school._id.toString(),
    name: school.name,
    district: school.district,
    buildingAge: school.buildingAge,
    materialType: school.materialType,
    weatherZone: school.weatherZone,
    totalStudents: school.totalStudents,
    isGirlsSchool: school.isGirlsSchool,
  };
}

function serializeQueueItem(prediction, report, school, workOrder = null) {
  const normalizedStatus = prediction.status === "pending" ? "awaiting_deo" : prediction.status;
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
    reportId:
      prediction.reportId?._id?.toString?.() ||
      prediction.reportId?.toString?.() ||
      report?._id?.toString?.() ||
      "",
    schoolId: school._id.toString(),
    school: school.name,
    district: school.district,
    issue: issueTitle(prediction.category, report),
    category: categoryLabel(prediction.category),
    categoryKey: prediction.category,
    risk: riskTone(prediction.riskScore),
    riskScore: prediction.riskScore,
    impactScore,
    urgencyScore,
    priorityScore,
    studentImpact: `${school.totalStudents} students affected`,
    studentCount: school.totalStudents,
    failureWindow: `Within ${prediction.failureWindowDays} days`,
    failureWindowDays: prediction.failureWindowDays,
    reason: prediction.reason.join(", "),
    reasons: prediction.reason,
    status: normalizedStatus,
    createdAt: prediction.createdAt,
    updatedAt: prediction.updatedAt,
    workOrderId: workOrder?._id?.toString() || null,
  };
}

async function getSchools() {
  await connectToDatabase();
  const schools = await School.find().sort({ district: 1, name: 1 }).lean();
  return schools.map((school) => ({
    ...school,
    _id: school._id.toString(),
    id: school._id.toString(),
  }));
}

async function createReportFromRequest(request) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["peon", "principal", "deo"]);

  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");
  const payload = isMultipart
    ? await request.formData()
    : new Map(Object.entries(await request.json()));
  const get = (key) => (typeof payload.get === "function" ? payload.get(key) : undefined);

  const schoolId = get("schoolId") || user.assignedSchoolId;
  if (!mongoose.Types.ObjectId.isValid(String(schoolId || ""))) {
    throw makeHttpError(400, "A valid schoolId is required.");
  }

  const school = await School.findById(schoolId);
  if (!school) {
    throw makeHttpError(404, "School was not found.");
  }

  const category = normalizeCategory(get("category"));
  if (!category) {
    throw makeHttpError(400, "Category must be plumbing, electrical, or structural.");
  }

  const reportInput = {
    conditionScore: clamp(toNumber(get("conditionScore"), 0), 0, 100),
    waterLeak: toBoolean(get("waterLeak")),
    wiringExposed: toBoolean(get("wiringExposed")),
    crackWidth: Math.max(0, toNumber(get("crackWidth"), 0)),
    toiletFunctionality: clamp(toNumber(get("toiletFunctionality"), 0), 0, 100),
  };

  const photoUrl = isMultipart ? await saveUpload(get("photo"), "report") : get("photoUrl");
  const report = await Report.create({
    schoolId: school._id,
    submittedBy: user._id,
    weekStartDate: get("weekStartDate") ? new Date(get("weekStartDate")) : new Date(),
    category,
    ...reportInput,
    photoUrl: photoUrl || null,
  });

  const mlPayload = {
    ...reportInput,
    waterLeak: reportInput.waterLeak ? 1 : 0,
    wiringExposed: reportInput.wiringExposed ? 1 : 0,
    buildingAge: Number(school.buildingAge),
    totalStudents: Number(school.totalStudents),
    isGirlsSchool: school.isGirlsSchool ? 1 : 0,
  };

  let prediction = null;
  let mlError = null;

  try {
    const mlPrediction = await callMLModel(mlPayload);
    const riskScore = clamp(Math.round(toNumber(mlPrediction.riskScore, 0)), 0, 100);
    const failureWindowDays = clamp(
      Math.round(toNumber(mlPrediction.failureWindowDays, 60)),
      30,
      60,
    );
    const impactScore = calculateImpactScore({
      totalStudents: school.totalStudents,
      isGirlsSchool: school.isGirlsSchool,
      category,
    });
    const urgencyScore = calculateUrgencyScore(failureWindowDays);
    const priorityScore = calculatePriorityScore({
      riskScore,
      impactScore,
      urgencyScore,
    });

    prediction = await Prediction.create({
      reportId: report._id,
      schoolId: school._id,
      category,
      riskScore,
      failureWindowDays,
      impactScore,
      urgencyScore,
      priorityScore,
      reason:
        Array.isArray(mlPrediction.reason) && mlPrediction.reason.length
          ? mlPrediction.reason
          : ["ML service returned prediction without explainability reason"],
      status: "awaiting_deo",
    });
  } catch (error) {
    mlError = error.message || "ML service failed.";
  }

  const basePayload = {
    reportId: report._id.toString(),
    schoolId: school._id.toString(),
    school: serializeSchool(school),
  };

  await emitWorkflowEvent("report:created", basePayload, workflowRooms({ schoolId: school._id }));

  if (prediction) {
    const queueItem = serializeQueueItem(prediction, report, school);
    await emitWorkflowEvent(
      "prediction:created",
      queueItem,
      workflowRooms({ schoolId: school._id }),
    );
    await emitWorkflowEvent(
      "priorityQueue:updated",
      { schoolId: school._id.toString() },
      workflowRooms({ schoolId: school._id }),
    );
    await emitWorkflowEvent(
      "principalStatus:updated",
      { schoolId: school._id.toString() },
      workflowRooms({ schoolId: school._id }),
    );
    await emitWorkflowEvent("analytics:updated", {}, workflowRooms({ schoolId: school._id }));
  }

  return {
    message: prediction
      ? "Report saved and prediction generated successfully."
      : "Report saved. ML prediction is pending because the ML service is unavailable.",
    report: {
      id: report._id.toString(),
      school: serializeSchool(school),
      category,
      ...reportInput,
      photoUrl,
    },
    prediction: prediction ? serializeQueueItem(prediction, report, school) : null,
    predictionStatus: prediction ? "created" : "pending",
    mlError,
  };
}

async function getPriorityQueue(request) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["deo"]);

  const predictions = await Prediction.find({
    status: { $in: ["awaiting_deo", "delayed", "pending"] },
  })
    .sort({ priorityScore: -1, failureWindowDays: 1, createdAt: -1 })
    .populate("schoolId")
    .populate("reportId")
    .lean();

  return predictions.map((prediction) =>
    serializeQueueItem(prediction, prediction.reportId, prediction.schoolId),
  );
}

async function getDeoAnalytics(request) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["deo"]);

  const [
    totalReports,
    highRiskCount,
    pendingAssignmentCount,
    inProgressRepairs,
    completedRepairs,
    predictionsByStatus,
    weeklyReports,
    priorityDistribution,
    districtDistribution,
  ] = await Promise.all([
    Report.countDocuments(),
    Prediction.countDocuments({ riskScore: { $gte: 72 } }),
    Prediction.countDocuments({ status: { $in: ["awaiting_deo", "delayed", "pending"] } }),
    WorkOrder.countDocuments({ status: "in_progress" }),
    WorkOrder.countDocuments({ status: { $in: ["completed", "verified"] } }),
    Prediction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Report.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$weekStartDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    Prediction.aggregate([
      {
        $bucket: {
          groupBy: "$priorityScore",
          boundaries: [0, 40, 70, 90, 101],
          default: "other",
          output: { count: { $sum: 1 } },
        },
      },
    ]),
    Prediction.aggregate([
      {
        $lookup: {
          from: "schools",
          localField: "schoolId",
          foreignField: "_id",
          as: "school",
        },
      },
      { $unwind: "$school" },
      { $group: { _id: "$school.district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const now = new Date();
  const slaBreaches = await WorkOrder.countDocuments({
    status: { $in: ["assigned", "in_progress"] },
    deadline: { $lt: now },
  });

  return {
    totalReports,
    highRiskCount,
    pendingAssignmentCount,
    inProgressRepairs,
    completedRepairs,
    slaBreaches,
    charts: {
      predictionsByStatus: predictionsByStatus.map((item) => ({
        label: item._id === "pending" ? "awaiting_deo" : item._id,
        value: item.count,
      })),
      weeklyReports: weeklyReports.map((item) => ({ label: item._id, value: item.count })),
      priorityDistribution: priorityDistribution.map((item) => ({
        label: String(item._id),
        value: item.count,
      })),
      districtDistribution: districtDistribution.map((item) => ({
        label: item._id,
        value: item.count,
      })),
    },
  };
}

async function assignPrediction(request) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["deo"]);
  const body = await request.json();

  if (!mongoose.Types.ObjectId.isValid(String(body.predictionId || ""))) {
    throw makeHttpError(400, "A valid predictionId is required.");
  }

  const prediction = await Prediction.findById(body.predictionId).populate("schoolId");
  if (!prediction) {
    throw makeHttpError(404, "Prediction was not found.");
  }

  if (!["awaiting_deo", "delayed", "pending"].includes(prediction.status)) {
    throw makeHttpError(409, "This issue is already assigned or completed.");
  }

  const contractor = body.contractorId
    ? await User.findOne({ _id: body.contractorId, role: "contractor" })
    : await User.findOne({ role: "contractor" }).sort({ createdAt: 1 });

  if (!contractor) {
    throw makeHttpError(404, "No contractor account is available.");
  }

  const deadline = body.deadline
    ? new Date(body.deadline)
    : new Date(Date.now() + Math.max(prediction.failureWindowDays, 1) * 24 * 60 * 60 * 1000);

  const workOrder = await WorkOrder.create({
    predictionId: prediction._id,
    schoolId: prediction.schoolId._id,
    assignedTo: contractor._id,
    assignedBy: user._id,
    status: "assigned",
    priorityScore: prediction.priorityScore,
    deadline,
  });

  prediction.status = "assigned";
  await prediction.save();

  const payload = {
    workOrderId: workOrder._id.toString(),
    predictionId: prediction._id.toString(),
    schoolId: prediction.schoolId._id.toString(),
    contractorId: contractor._id.toString(),
  };
  const rooms = workflowRooms({
    schoolId: prediction.schoolId._id,
    contractorId: contractor._id,
  });

  await emitWorkflowEvent("contractorTask:assigned", payload, rooms);
  await emitWorkflowEvent("priorityQueue:updated", payload, rooms);
  await emitWorkflowEvent("principalStatus:updated", payload, rooms);
  await emitWorkflowEvent("analytics:updated", payload, rooms);

  return {
    message: "Contractor assigned successfully.",
    workOrderId: workOrder._id.toString(),
    assignedTo: contractor.name,
  };
}

async function getPrincipalStatus(request) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["principal", "deo"]);

  const schoolId =
    request.nextUrl?.searchParams?.get("schoolId") ||
    user.assignedSchoolId?.toString();

  if (!mongoose.Types.ObjectId.isValid(String(schoolId || ""))) {
    return {
      school: null,
      issues: [],
      latestReports: [],
    };
  }

  const school = await School.findById(schoolId).lean();
  if (!school) {
    return {
      school: null,
      issues: [],
      latestReports: [],
    };
  }

  const [predictions, latestReports] = await Promise.all([
    Prediction.find({ schoolId })
      .sort({ createdAt: -1 })
      .populate("reportId")
      .lean(),
    Report.find({ schoolId }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const workOrders = await WorkOrder.find({
    predictionId: { $in: predictions.map((prediction) => prediction._id) },
  })
    .populate("assignedTo", "name email")
    .lean();
  const workOrderByPrediction = new Map(
    workOrders.map((workOrder) => [workOrder.predictionId.toString(), workOrder]),
  );

  return {
    school: serializeSchool(school),
    issues: predictions.map((prediction) => {
      const workOrder = workOrderByPrediction.get(prediction._id.toString());
      return {
        ...serializeQueueItem(prediction, prediction.reportId, school, workOrder),
        contractor: workOrder?.assignedTo
          ? {
              name: workOrder.assignedTo.name,
              email: workOrder.assignedTo.email,
            }
          : null,
        deadline: workOrder?.deadline || null,
        assignedAt: workOrder?.assignedAt || null,
        completedAt: workOrder?.completedAt || null,
      };
    }),
    latestReports: latestReports.map((report) => ({
      id: report._id.toString(),
      category: report.category,
      conditionScore: report.conditionScore,
      waterLeak: report.waterLeak,
      wiringExposed: report.wiringExposed,
      crackWidth: report.crackWidth,
      toiletFunctionality: report.toiletFunctionality,
      photoUrl: report.photoUrl,
      createdAt: report.createdAt,
    })),
  };
}

async function getPrincipalAnalytics(request) {
  const status = await getPrincipalStatus(request);
  const schoolId = status.school?.id;

  if (!schoolId) {
    return {
      schoolIssueCount: 0,
      activeRepairs: 0,
      resolvedRepairs: 0,
      currentRiskOverview: [],
      charts: { issueStatusDistribution: [], weeklyReportsTrend: [] },
    };
  }

  const [issueStatusDistribution, weeklyReportsTrend] = await Promise.all([
    Prediction.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Report.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$weekStartDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  return {
    schoolIssueCount: status.issues.length,
    activeRepairs: status.issues.filter((issue) =>
      ["assigned", "in_progress", "awaiting_deo", "delayed"].includes(issue.status),
    ).length,
    resolvedRepairs: status.issues.filter((issue) =>
      ["completed", "verified"].includes(issue.status),
    ).length,
    currentRiskOverview: status.issues.map((issue) => ({
      label: issue.category,
      value: issue.riskScore,
    })),
    charts: {
      issueStatusDistribution: issueStatusDistribution.map((item) => ({
        label: item._id,
        value: item.count,
      })),
      weeklyReportsTrend: weeklyReportsTrend.map((item) => ({
        label: item._id,
        value: item.count,
      })),
    },
  };
}

async function getContractorTasks(request) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["contractor", "deo"]);
  const contractorId =
    user.role === "contractor"
      ? user._id
      : request.nextUrl?.searchParams?.get("contractorId");

  const query = contractorId ? { assignedTo: contractorId } : {};
  const workOrders = await WorkOrder.find(query)
    .sort({ status: 1, deadline: 1, assignedAt: -1 })
    .populate("predictionId")
    .populate("schoolId")
    .lean();

  return workOrders.map((workOrder) => {
    const prediction = workOrder.predictionId;
    const school = workOrder.schoolId;
    return {
      id: workOrder._id.toString(),
      workOrderId: workOrder._id.toString(),
      predictionId: prediction._id.toString(),
      schoolId: school._id.toString(),
      title: issueTitle(prediction.category, {}),
      site: school.name,
      district: school.district,
      priorityScore: workOrder.priorityScore || prediction.priorityScore,
      dueDate: workOrder.deadline,
      deadline: workOrder.deadline
        ? new Date(workOrder.deadline).toLocaleDateString("en-IN")
        : "No deadline",
      location:
        prediction.category === "plumbing"
          ? "Toilet Cluster"
          : prediction.category === "electrical"
            ? "Corridor Switchboard"
            : "Main Building Wall",
      status: workOrder.status,
      riskScore: prediction.riskScore,
      reason: prediction.reason.join(", "),
    };
  });
}

async function getContractorAnalytics(request) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["contractor", "deo"]);
  const assignedTo = user.role === "contractor" ? user._id : undefined;
  const match = assignedTo ? { assignedTo } : {};
  const now = new Date();

  const [assignedTasks, inProgressTasks, completedTasks, overdueTasks, statusDistribution] =
    await Promise.all([
      WorkOrder.countDocuments({ ...match, status: "assigned" }),
      WorkOrder.countDocuments({ ...match, status: "in_progress" }),
      WorkOrder.countDocuments({ ...match, status: { $in: ["completed", "verified"] } }),
      WorkOrder.countDocuments({
        ...match,
        status: { $in: ["assigned", "in_progress"] },
        deadline: { $lt: now },
      }),
      WorkOrder.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

  return {
    assignedTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    charts: {
      taskStatusDistribution: statusDistribution.map((item) => ({
        label: item._id,
        value: item.count,
      })),
    },
  };
}

async function startWorkOrder(request, workOrderId) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["contractor"]);

  const workOrder = await WorkOrder.findOne({ _id: workOrderId, assignedTo: user._id });
  if (!workOrder) {
    throw makeHttpError(404, "Work order was not found.");
  }

  workOrder.status = "in_progress";
  await workOrder.save();
  await Prediction.updateOne({ _id: workOrder.predictionId }, { $set: { status: "in_progress" } });

  const payload = {
    workOrderId: workOrder._id.toString(),
    predictionId: workOrder.predictionId.toString(),
    schoolId: workOrder.schoolId.toString(),
    contractorId: user._id.toString(),
  };
  const rooms = workflowRooms({ schoolId: workOrder.schoolId, contractorId: user._id });
  await emitWorkflowEvent("contractorTask:started", payload, rooms);
  await emitWorkflowEvent("principalStatus:updated", payload, rooms);
  await emitWorkflowEvent("analytics:updated", payload, rooms);

  return { message: "Task marked in progress." };
}

async function completeWorkOrder(request, workOrderIdFromParam = null) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["contractor"]);
  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");
  const payload = isMultipart
    ? await request.formData()
    : new Map(Object.entries(await request.json()));
  const get = (key) => (typeof payload.get === "function" ? payload.get(key) : undefined);
  const workOrderId = workOrderIdFromParam || get("workOrderId");

  if (!mongoose.Types.ObjectId.isValid(String(workOrderId || ""))) {
    throw makeHttpError(400, "A valid workOrderId is required.");
  }

  const workOrder = await WorkOrder.findOne({ _id: workOrderId, assignedTo: user._id });
  if (!workOrder) {
    throw makeHttpError(404, "Work order was not found.");
  }

  const photoUrl = isMultipart ? await saveUpload(get("photo"), "completion") : get("photoUrl");
  if (!photoUrl) {
    throw makeHttpError(400, "Completion photo is required.");
  }

  const latitude = toNumber(get("latitude"), Number.NaN);
  const longitude = toNumber(get("longitude"), Number.NaN);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw makeHttpError(400, "GPS latitude and longitude are required.");
  }

  const completionLog = await CompletionLog.create({
    workOrderId: workOrder._id,
    photoUrl,
    gpsLocation: {
      latitude: clamp(latitude, -90, 90),
      longitude: clamp(longitude, -180, 180),
    },
    remarks: String(get("remarks") || ""),
    verified: false,
  });

  workOrder.status = "completed";
  workOrder.completedAt = new Date();
  await workOrder.save();
  await Prediction.updateOne({ _id: workOrder.predictionId }, { $set: { status: "completed" } });

  const eventPayload = {
    workOrderId: workOrder._id.toString(),
    predictionId: workOrder.predictionId.toString(),
    schoolId: workOrder.schoolId.toString(),
    contractorId: user._id.toString(),
    completionLogId: completionLog._id.toString(),
  };
  const rooms = workflowRooms({ schoolId: workOrder.schoolId, contractorId: user._id });
  await emitWorkflowEvent("contractorTask:completed", eventPayload, rooms);
  await emitWorkflowEvent("principalStatus:updated", eventPayload, rooms);
  await emitWorkflowEvent("priorityQueue:updated", eventPayload, rooms);
  await emitWorkflowEvent("analytics:updated", eventPayload, rooms);

  return {
    message: "Completion proof uploaded and work order marked completed.",
    completionLogId: completionLog._id.toString(),
    photoUrl,
  };
}

async function getReportsForSchool(request, schoolId) {
  await connectToDatabase();
  const user = await getUserFromRequest(request);
  requireRole(user, ["principal", "deo"]);
  const targetSchoolId = schoolId || user.assignedSchoolId;

  if (!mongoose.Types.ObjectId.isValid(String(targetSchoolId || ""))) {
    throw makeHttpError(400, "A valid schoolId is required.");
  }

  const reports = await Report.find({ schoolId: targetSchoolId })
    .sort({ createdAt: -1 })
    .populate("submittedBy", "name role")
    .lean();

  return reports.map((report) => ({
    id: report._id.toString(),
    category: report.category,
    conditionScore: report.conditionScore,
    waterLeak: report.waterLeak,
    wiringExposed: report.wiringExposed,
    crackWidth: report.crackWidth,
    toiletFunctionality: report.toiletFunctionality,
    photoUrl: report.photoUrl,
    submittedBy: report.submittedBy,
    createdAt: report.createdAt,
  }));
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
  startWorkOrder,
};
