import mongoose from "mongoose";

const parentNodeSchema = new mongoose.Schema(
  {
    path: String,
    name: String,
    recordId: String,
    status: Boolean,
    identifier: String,
  },
  { _id: false }
);

const nodeSchema = new mongoose.Schema({
  path: { type: String, required: true },
  parentNode: { type: parentNodeSchema, default: null }, 
  recordId: { type: String, required: true, unique: true }, 
  displayPriority: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
  creationTime: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
  identifier: { type: String, required: true },
  name: { type: String },
  shortDescription: { type: String },
  creator: { type: String, required: true }, 
  modifiedBy: { type: String },
  _class: {
    type: String,
    default: "com.VijayLamps.lamps.model.Node",
  },
});

// Update `lastModified`
nodeSchema.pre("save", function (next) {
  this.lastModified = Date.now();
  next();
});

const Node = mongoose.model("Node", nodeSchema);
export default Node;
