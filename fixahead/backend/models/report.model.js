const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const reportSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["plumbing", "electrical", "structural"],
      index: true,
    },
    conditionScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    waterLeak: {
      type: Boolean,
      default: false,
    },
    wiringExposed: {
      type: Boolean,
      default: false,
    },
    crackWidth: {
      type: Number,
      default: 0,
      min: 0,
    },
    toiletFunctionality: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reportSchema.index({ schoolId: 1, weekStartDate: -1 });
reportSchema.index({ schoolId: 1, category: 1, weekStartDate: 1 }, { unique: true });
reportSchema.index({ submittedBy: 1, createdAt: -1 });

const Report = models.Report || model("Report", reportSchema);

module.exports = Report;
