function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function calculateImpactScore({ totalStudents = 0, isGirlsSchool = false, category = "" }) {
  const studentLoad = clamp((Number(totalStudents) / 250) * 70, 0, 70);
  const girlsSchoolWeight = isGirlsSchool && category === "plumbing" ? 15 : 0;
  const safetyWeight = category === "electrical" || category === "structural" ? 12 : 8;

  return Math.round(clamp(studentLoad + girlsSchoolWeight + safetyWeight));
}

function calculateUrgencyScore(failureWindowDays) {
  const days = Number(failureWindowDays) || 60;
  return Math.round(clamp(((60 - days) / 30) * 100));
}

function calculatePriorityScore({ riskScore, impactScore, urgencyScore }) {
  return Math.round(
    clamp(
      Number(riskScore) * 0.5 +
        Number(impactScore) * 0.3 +
        Number(urgencyScore) * 0.2,
    ),
  );
}

module.exports = {
  calculateImpactScore,
  calculatePriorityScore,
  calculateUrgencyScore,
};
