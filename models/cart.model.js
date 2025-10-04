import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      recordId: { type: String, required: true },
      name: { type: String, required: true },
      identifier: { type: String, required: true },
      slug: { type: String, required: true },
      price: { type: Number, required: true },
      discountPrice: { type: Number },
      images: [{ type: String }],
      stock: { type: Number, required: true },
      status: { type: Boolean, default: true },
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    selectedAttributes: [
      {
        key: String,
        value: String,
      },
    ],
    itemTotal: { type: Number, required: true },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  items: [cartItemSchema],

  itemsCount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

cartSchema.pre("save", function (next) {
  this.itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce((sum, item) => sum + item.itemTotal, 0);

  this.discount = this.items.reduce((sum, item) => {
    const originalTotal = item.product.price * item.quantity;
    const sellingTotal =
      (item.product.discountPrice || item.product.price) * item.quantity;
    return sum + (originalTotal - sellingTotal);
  }, 0);

  this.tax = this.subtotal * 0.18;

  this.total = this.subtotal + this.tax;
  this.updatedAt = new Date();
  next();
});

cartItemSchema.pre("save", function (next) {
  const sellingPrice = this.product.discountPrice || this.product.price;
  this.itemTotal = sellingPrice * this.quantity;
  next();
});

export default mongoose.model("Cart", cartSchema);
