const axios = require("axios");
const path = require("path");
const { spawn } = require("child_process");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_SERVICE_TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS || 10000);
let startupPromise = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForMLHealth() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 1000 });
      return true;
    } catch {
      await sleep(500);
    }
  }

  return false;
}

async function startLocalMLService() {
  if (startupPromise) {
    return startupPromise;
  }

  startupPromise = (async () => {
    const serviceDir = path.join(process.cwd(), "ml-service");
    const child = spawn(
      process.env.PYTHON_BIN || "python",
      ["-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8000"],
      {
        cwd: serviceDir,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      },
    );

    child.unref();
    return waitForMLHealth();
  })();

  return startupPromise;
}

async function postPrediction(data) {
  const response = await axios.post(`${ML_SERVICE_URL}/predict`, data, {
    timeout: ML_SERVICE_TIMEOUT_MS,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

async function callMLModel(data, options = { retryWithLocalStart: true }) {
  try {
    return await postPrediction(data);
  } catch (error) {
    if (
      options.retryWithLocalStart &&
      (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND")
    ) {
      const started = await startLocalMLService();
      if (started) {
        return callMLModel(data, { retryWithLocalStart: false });
      }
    }

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
