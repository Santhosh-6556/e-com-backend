import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "seller"],
      default: "user",
    },
    phone: {
      type: Number,
    },
    addresses: [addressSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    otpLastSent: {
      type: Date,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;