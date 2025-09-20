import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },
  identifier: { type: String, required: true },
  name: { type: String,},
  shortDescription: { type: String },
  image: { type: String },
  // type: { type: String, enum: ["category", "subcategory", "brand"], required: true },
  parentCategory: {
    recordId: { type: String },
    identifier: { type: String },
    name: { type: String },
    shortDescription: { type: String },
    image: { type: String }
  },
  displayPriority: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
  creator: { type: String },
  creationTime: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
});

categorySchema.pre("save", function (next) {
  this.lastModified = Date.now();
  next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
