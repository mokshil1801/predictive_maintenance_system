const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_SERVICE_TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS || 10000);

async function callMLModel(data) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, data, {
      timeout: ML_SERVICE_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      const timeoutError = new Error("ML inference request timed out.");
      timeoutError.statusCode = 504;
      timeoutError.code = "ML_TIMEOUT";
      throw timeoutError;
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      const unavailableError = new Error("ML inference service is unavailable.");
      unavailableError.statusCode = 503;
      unavailableError.code = "ML_UNAVAILABLE";
      throw unavailableError;
    }

    if (error.response) {
      const downstreamError = new Error(
        error.response.data?.detail || "ML inference request failed.",
      );
      downstreamError.statusCode = error.response.status || 502;
      downstreamError.code = "ML_BAD_RESPONSE";
      throw downstreamError;
    }

    const unknownError = new Error(error.message || "Unexpected ML service failure.");
    unknownError.statusCode = 500;
    unknownError.code = "ML_UNKNOWN_ERROR";
    throw unknownError;
  }
}

module.exports = {
  callMLModel,
};
