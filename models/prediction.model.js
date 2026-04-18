const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const predictionSchema = new Schema(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: "Report",
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
    category: {
      type: String,
      required: true,
      enum: ["plumbing", "electrical", "structural"],
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    failureWindowDays: {
      type: Number,
      required: true,
      min: 30,
      max: 60,
    },
    priorityScore: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one prediction reason is required.",
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "assigned", "completed"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

predictionSchema.index({ schoolId: 1, status: 1, priorityScore: -1 });
predictionSchema.index({ schoolId: 1, category: 1, createdAt: -1 });
predictionSchema.index({ status: 1, failureWindowDays: 1, priorityScore: -1 });

const Prediction = models.Prediction || model("Prediction", predictionSchema);

module.exports = Prediction;
