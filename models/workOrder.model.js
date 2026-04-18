const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const workOrderSchema = new Schema(
  {
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: "Prediction",
      required: true,
      unique: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["assigned", "in_progress", "completed", "verified", "delayed"],
      default: "assigned",
      index: true,
    },
    priorityScore: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    deadline: {
      type: Date,
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

workOrderSchema.index({ schoolId: 1, status: 1, assignedAt: -1 });
workOrderSchema.index({ assignedTo: 1, status: 1, assignedAt: -1 });

const WorkOrder = models.WorkOrder || model("WorkOrder", workOrderSchema);

module.exports = WorkOrder;
