const {
  assignPrediction,
  getContractorAnalytics,
  getContractorTasks,
  getDeoAnalytics,
  getPrincipalAnalytics,
  getPrincipalStatus,
  getPriorityQueue,
  startWorkOrder,
} = require("../lib/fixahead-api");
const { CompletionLog, Prediction, WorkOrder } = require("../models");
const { emitWorkflowEvent, workflowRooms } = require("../services/realtime.service");

function toNextLikeRequest(req) {
  const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);

  return {
    headers: {
      get: (name) => req.get(name),
    },
    nextUrl: {
      searchParams: url.searchParams,
    },
    json: async () => req.body,
  };
}

async function priorityQueue(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      queue: await getPriorityQueue(toNextLikeRequest(req)),
    });
  } catch (error) {
    return next(error);
  }
}

async function deoAnalytics(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      ...(await getDeoAnalytics(toNextLikeRequest(req))),
    });
  } catch (error) {
    return next(error);
  }
}

async function assign(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      ...(await assignPrediction(toNextLikeRequest(req))),
    });
  } catch (error) {
    return next(error);
  }
}

async function principalStatus(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      ...(await getPrincipalStatus(toNextLikeRequest(req))),
    });
  } catch (error) {
    return next(error);
  }
}

async function principalAnalytics(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      ...(await getPrincipalAnalytics(toNextLikeRequest(req))),
    });
  } catch (error) {
    return next(error);
  }
}

async function contractorTasks(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      tasks: await getContractorTasks(toNextLikeRequest(req)),
    });
  } catch (error) {
    return next(error);
  }
}

async function contractorAnalytics(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      ...(await getContractorAnalytics(toNextLikeRequest(req))),
    });
  } catch (error) {
    return next(error);
  }
}

async function startTask(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      ...(await startWorkOrder(toNextLikeRequest(req), req.params.id)),
    });
  } catch (error) {
    return next(error);
  }
}

async function completeTask(req, res, next) {
  try {
    const contractor = req.authenticatedUser;
    const workOrder = await WorkOrder.findOne({
      _id: req.params.id,
      assignedTo: contractor._id,
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: "Work order was not found." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Completion photo is required." });
    }

    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        message: "GPS latitude and longitude are required.",
      });
    }

    const completionLog = await CompletionLog.create({
      workOrderId: workOrder._id,
      photoUrl: `/uploads/${req.file.filename}`,
      gpsLocation: { latitude, longitude },
      remarks: req.body.remarks || "",
      verified: false,
    });

    workOrder.status = "completed";
    workOrder.completedAt = new Date();
    await workOrder.save();
    await Prediction.updateOne(
      { _id: workOrder.predictionId },
      { $set: { status: "completed" } },
    );

    const payload = {
      workOrderId: workOrder._id.toString(),
      predictionId: workOrder.predictionId.toString(),
      schoolId: workOrder.schoolId.toString(),
      contractorId: contractor._id.toString(),
      completionLogId: completionLog._id.toString(),
    };
    const rooms = workflowRooms({
      schoolId: workOrder.schoolId,
      contractorId: contractor._id,
    });

    await emitWorkflowEvent("contractorTask:completed", payload, rooms);
    await emitWorkflowEvent("principalStatus:updated", payload, rooms);
    await emitWorkflowEvent("priorityQueue:updated", payload, rooms);
    await emitWorkflowEvent("analytics:updated", payload, rooms);

    return res.status(200).json({
      success: true,
      message: "Completion proof uploaded and work order marked completed.",
      completionLogId: completionLog._id.toString(),
      photoUrl: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    return next(error);
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
