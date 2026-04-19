const fs = require("fs");
const {
  assignPrediction,
  completeWorkOrder,
  getContractorAnalytics,
  getContractorTasks,
  getDeoAnalytics,
  getPrincipalAnalytics,
  getPrincipalStatus,
  getPriorityQueue,
  startWorkOrder,
} = require("../lib/fixahead-api");

function toNextLikeRequest(req) {
  return {
    headers: {
      get: (name) => req.headers[String(name).toLowerCase()],
    },
    nextUrl: {
      searchParams: new URLSearchParams(req.query),
    },
    json: async () => req.body || {},
    formData: async () => {
      const formData = new FormData();
      Object.entries(req.body || {}).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (req.file) {
        const buffer = req.file.buffer || fs.readFileSync(req.file.path);
        formData.append(
          req.file.fieldname || "photo",
          new File([buffer], req.file.originalname || req.file.filename, {
            type: req.file.mimetype,
          }),
        );
      }

      return formData;
    },
  };
}

function sendError(res, error) {
  return res.status(error.status || error.statusCode || 500).json({
    message: error.message || "Unexpected FixAhead workflow error.",
    code: error.code || "WORKFLOW_ERROR",
  });
}

async function priorityQueue(req, res) {
  try {
    return res.json({ items: await getPriorityQueue(toNextLikeRequest(req)) });
  } catch (error) {
    return sendError(res, error);
  }
}

async function deoAnalytics(req, res) {
  try {
    return res.json(await getDeoAnalytics(toNextLikeRequest(req)));
  } catch (error) {
    return sendError(res, error);
  }
}

async function assign(req, res) {
  try {
    return res.status(201).json({ task: await assignPrediction(toNextLikeRequest(req)) });
  } catch (error) {
    return sendError(res, error);
  }
}

async function principalStatus(req, res) {
  try {
    return res.json(await getPrincipalStatus(toNextLikeRequest(req)));
  } catch (error) {
    return sendError(res, error);
  }
}

async function principalAnalytics(req, res) {
  try {
    return res.json(await getPrincipalAnalytics(toNextLikeRequest(req)));
  } catch (error) {
    return sendError(res, error);
  }
}

async function contractorTasks(req, res) {
  try {
    return res.json({ tasks: await getContractorTasks(toNextLikeRequest(req)) });
  } catch (error) {
    return sendError(res, error);
  }
}

async function contractorAnalytics(req, res) {
  try {
    return res.json(await getContractorAnalytics(toNextLikeRequest(req)));
  } catch (error) {
    return sendError(res, error);
  }
}

async function startTask(req, res) {
  try {
    return res.json({ task: await startWorkOrder(toNextLikeRequest(req), req.params.id) });
  } catch (error) {
    return sendError(res, error);
  }
}

async function completeTask(req, res) {
  try {
    return res.json({ task: await completeWorkOrder(toNextLikeRequest(req), req.params.id) });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  assign,
  contractorAnalytics,
  contractorTasks,
  completeTask,
  deoAnalytics,
  principalAnalytics,
  principalStatus,
  priorityQueue,
  startTask,
};
