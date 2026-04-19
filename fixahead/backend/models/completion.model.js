const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const gpsLocationSchema = new Schema(
  {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  {
    _id: false,
  },
);

const completionLogSchema = new Schema(
  {
    workOrderId: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
      index: true,
    },
    photoUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    gpsLocation: {
      type: gpsLocationSchema,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

completionLogSchema.index({ workOrderId: 1, createdAt: -1 });
completionLogSchema.index({ verified: 1, createdAt: -1 });

const CompletionLog =
  models.CompletionLog || model("CompletionLog", completionLogSchema);

module.exports = CompletionLog;
