function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateImpactScore({ totalStudents = 0, isGirlsSchool = false, category }) {
  const studentLoad = clamp((Number(totalStudents) / 250) * 100, 0, 80);
  const girlsSchoolBoost = isGirlsSchool ? 10 : 0;
  const categoryBoost = category === "electrical" || category === "structural" ? 10 : 6;

  return Number(clamp(studentLoad + girlsSchoolBoost + categoryBoost, 0, 100).toFixed(2));
}

function calculateUrgencyScore(failureWindowDays) {
  const windowDays = clamp(Number(failureWindowDays || 60), 1, 60);
  return Number(clamp(((60 - windowDays) / 59) * 100, 0, 100).toFixed(2));
}

function calculatePriorityScore({ riskScore, impactScore, urgencyScore }) {
  return Number(
    (
      Number(riskScore || 0) * 0.5 +
      Number(impactScore || 0) * 0.3 +
      Number(urgencyScore || 0) * 0.2
    ).toFixed(2),
  );
}

module.exports = {
  calculateImpactScore,
  calculatePriorityScore,
  calculateUrgencyScore,
};
