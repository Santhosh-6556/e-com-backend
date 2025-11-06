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
      unique: true, // Automatically creates an index
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

wishlistSchema.pre("save", function (next) {
  this.itemCount = this.items.length;
  next();
});

// ✅ Keep only the secondary index
try {
  wishlistSchema.index({ "items.productRecordId": 1 });
} catch (error) {
  // Ignore index errors in Workers
}

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;
