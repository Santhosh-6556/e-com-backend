import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },
  identifier: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  status: { type: Boolean, default: true },
  creationTime: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
});

faqSchema.pre("save", function (next) {
  this.lastModified = Date.now();
  next();
});

const FAQ = mongoose.model("FAQ", faqSchema);
export default FAQ;
