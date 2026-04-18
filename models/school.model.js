const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const schoolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 120,
    },
    buildingAge: {
      type: Number,
      required: true,
      min: 0,
      max: 200,
    },
    materialType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    weatherZone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    totalStudents: {
      type: Number,
      required: true,
      min: 0,
    },
    isGirlsSchool: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

schoolSchema.index({ district: 1, name: 1 }, { unique: true });
schoolSchema.index({ weatherZone: 1 });

const School = models.School || model("School", schoolSchema);

module.exports = School;
