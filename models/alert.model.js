const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const alertSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: "Prediction",
      default: null,
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    sentTo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      default: "sent",
      index: true,
    },
    providerMessageId: {
      type: String,
      default: null,
      trim: true,
    },
    errorMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

alertSchema.index({ schoolId: 1, createdAt: -1 });
alertSchema.index({ predictionId: 1, status: 1 });

const Alert = models.Alert || model("Alert", alertSchema);

module.exports = Alert;
