import mongoose from "mongoose";

const taxSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },

  identifier: { type: String, required: true },
  rate: { type: String },

  status: { type: Boolean, default: true },
});

taxSchema.pre("save", function (next) {
  this.lastModified = Date.now();
  next();
});

const Tax = mongoose.model("Tax", taxSchema);
export default Tax;