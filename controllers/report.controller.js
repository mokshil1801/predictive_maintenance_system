const { Prediction, Report, School } = require("../models");
const { callMLModel } = require("../services/ml.service");
const { emitWorkflowEvent, workflowRooms } = require("../services/realtime.service");
const {
  calculateImpactScore,
  calculatePriorityScore,
  calculateUrgencyScore,
} = require("../utils/priority.util");

function toBinary(value) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return Number(value) > 0 ? 1 : 0;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

async function createReport(req, res, next) {
  try {
    const {
      schoolId,
      submittedBy,
      weekStartDate,
      category,
      conditionScore,
      waterLeak,
      wiringExposed,
      crackWidth,
      toiletFunctionality,
      photoUrl,
    } = req.body;
    const uploadedPhotoUrl = req.file ? `/uploads/${req.file.filename}` : photoUrl;

    const report = await Report.create({
      schoolId,
      submittedBy,
      weekStartDate,
      category,
      conditionScore,
      waterLeak,
      wiringExposed,
      crackWidth,
      toiletFunctionality,
      photoUrl: uploadedPhotoUrl || null,
    });

    const school = await School.findById(schoolId)
      .select("buildingAge totalStudents isGirlsSchool")
      .lean();

    if (!school) {
      const notFoundError = new Error("School not found for the submitted report.");
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    const mlPayload = {
      conditionScore: Number(conditionScore),
      waterLeak: toBinary(waterLeak),
      wiringExposed: toBinary(wiringExposed),
      crackWidth: Number(crackWidth || 0),
      toiletFunctionality: Number(toiletFunctionality),
      buildingAge: Number(school.buildingAge),
      totalStudents: Number(school.totalStudents),
      isGirlsSchool: toBinary(school.isGirlsSchool),
    };

    const mlPrediction = await callMLModel(mlPayload);
    const failureWindowDays = clamp(Number(mlPrediction.failureWindowDays), 30, 60);
    const riskScore = Number(mlPrediction.riskScore);
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

    const prediction = await Prediction.create({
      reportId: report._id,
      schoolId,
      category,
      riskScore,
      failureWindowDays,
      impactScore,
      urgencyScore,
      priorityScore,
      reason: Array.isArray(mlPrediction.reason) && mlPrediction.reason.length
        ? mlPrediction.reason
        : ["insufficient explainability output from ML service"],
      status: "awaiting_deo",
    });

    const rooms = workflowRooms({ schoolId });
    await emitWorkflowEvent(
      "report:created",
      { reportId: report._id.toString(), schoolId: schoolId.toString() },
      rooms,
    );
    await emitWorkflowEvent(
      "prediction:created",
      { predictionId: prediction._id.toString(), schoolId: schoolId.toString() },
      rooms,
    );
    await emitWorkflowEvent(
      "priorityQueue:updated",
      { predictionId: prediction._id.toString(), schoolId: schoolId.toString() },
      rooms,
    );
    await emitWorkflowEvent(
      "principalStatus:updated",
      { predictionId: prediction._id.toString(), schoolId: schoolId.toString() },
      rooms,
    );
    await emitWorkflowEvent("analytics:updated", { schoolId: schoolId.toString() }, rooms);

    return res.status(201).json({
      message: "Report saved and prediction generated successfully.",
      report,
      prediction,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    return next(error);
  }
}

module.exports = {
  createReport,
  calculatePriorityScore,
};
