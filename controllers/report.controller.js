const { Prediction, Report, School } = require("../models");
const { callMLModel } = require("../services/ml.service");

function toBinary(value) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return Number(value) > 0 ? 1 : 0;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function calculatePriorityScore({
  riskScore,
  failureWindowDays,
  totalStudents,
  isGirlsSchool,
  category,
}) {
  const urgencyWeight = 60 - clamp(failureWindowDays, 30, 60);
  const studentImpactWeight = clamp(Number(totalStudents || 0) / 20, 0, 25);
  const girlsSchoolWeight = isGirlsSchool ? 5 : 0;
  const categoryWeightMap = {
    plumbing: 4,
    electrical: 6,
    structural: 7,
  };
  const categoryWeight = categoryWeightMap[category] || 0;

  return Number(
    (
      riskScore * 0.55 +
      urgencyWeight * 0.9 +
      studentImpactWeight +
      girlsSchoolWeight +
      categoryWeight
    ).toFixed(2),
  );
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
      photoUrl: photoUrl || null,
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
    const priorityScore = calculatePriorityScore({
      riskScore: Number(mlPrediction.riskScore),
      failureWindowDays: Number(mlPrediction.failureWindowDays),
      totalStudents: school.totalStudents,
      isGirlsSchool: school.isGirlsSchool,
      category,
    });

    const prediction = await Prediction.create({
      reportId: report._id,
      schoolId,
      category,
      riskScore: Number(mlPrediction.riskScore),
      failureWindowDays: clamp(Number(mlPrediction.failureWindowDays), 30, 60),
      priorityScore,
      reason: Array.isArray(mlPrediction.reason) && mlPrediction.reason.length
        ? mlPrediction.reason
        : ["insufficient explainability output from ML service"],
      status: "pending",
    });

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
