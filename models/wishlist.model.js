import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema({
  productRecordId: {
    type: String,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const wishlistSchema = new mongoose.Schema(
  {
    userRecordId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [wishlistItemSchema],
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Update itemCount before saving
wishlistSchema.pre("save", function (next) {
  this.itemCount = this.items.length;
  next();
});

// Index for better performance
// Wrap in try-catch for Workers compatibility (Mongoose emits warnings via process.emitWarning)
try {
  // wishlistSchema.index({ userRecordId: 1 });
  wishlistSchema.index({ "items.productRecordId": 1 });
} catch (error) {
  // Silently ignore index errors in Workers (Mongoose is incompatible with Workers anyway)
  // MongoDB connections will fail regardless due to TCP requirement
}

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
