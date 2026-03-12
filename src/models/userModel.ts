import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["M", "F"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    googleId: {
      type: String,
      default: "null",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verifyToken: {
      type: String,
      default: null,
    },
    verifyTokenExpires: {
      type: Date,
      default: null,
    },
    auth2F: {
      type: Boolean,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("Users", userSchema);

export default userModel;
