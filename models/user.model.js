const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      required: true,
      enum: ["peon", "principal", "deo", "contractor"],
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    assignedSchoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 120,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ role: 1, district: 1 });
userSchema.index({ assignedSchoolId: 1, role: 1 });
userSchema.index({ phone: 1 }, { unique: true });

const User = models.User || model("User", userSchema);

module.exports = User;
