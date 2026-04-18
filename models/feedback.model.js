const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const feedbackSchema = new Schema(
  {
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: "Prediction",
      required: true,
      unique: true,
      index: true,
    },
    actualFailure: {
      type: Boolean,
      required: true,
    },
    repairTimeDays: {
      type: Number,
      required: true,
      min: 0,
    },
    accuracyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ actualFailure: 1, accuracyScore: -1 });

const RepairFeedback =
  models.RepairFeedback || model("RepairFeedback", feedbackSchema);

module.exports = RepairFeedback;
