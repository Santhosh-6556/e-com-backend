import mongoose from "mongoose";
import Tax from "../models/tax.model.js"; 

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      recordId: { type: String, required: true },
      name: { type: String, },
      identifier: { type: String, required: true },
      slug: { type: String, required: true },
      price: { type: Number, required: true },
      discountPrice: { type: Number },
      images: [{ type: String }],
      stock: { type: Number, required: true },
      status: { type: Boolean, default: true },
      taxRecordId: { type: String },   
      taxRate: { type: Number, default: 0 },
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    selectedAttributes: [
      {
        key: String,
        value: String,
      },
    ],
    itemTotal: { type: Number, required: true },
    itemTax: { type: Number, default: 0 }, 
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

// ✅ Calculate per-item tax + totals
cartSchema.pre("save", async function (next) {
  this.itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce((sum, item) => sum + item.itemTotal, 0);

  this.discount = this.items.reduce((sum, item) => {
    const originalTotal = item.product.price * item.quantity;
    const sellingTotal =
      (item.product.discountPrice || item.product.price) * item.quantity;
    return sum + (originalTotal - sellingTotal);
  }, 0);

  // Reset totals
  this.tax = 0;

  // Fetch tax rates per item if needed
  for (let item of this.items) {
    let taxRate = item.product.taxRate || 0;

    if (item.product.taxRecordId && !item.product.taxRate) {
      const tax = await Tax.findOne({
        recordId: item.product.taxRecordId,
        status: true,
      });
      if (tax && tax.rate) {
        taxRate = parseFloat(tax.rate);
        item.product.taxRate = taxRate; // store for future
      }
    }

    const basePrice = item.product.discountPrice || item.product.price;
    item.itemTotal = basePrice * item.quantity;
    item.itemTax = ((item.itemTotal * taxRate) / 100);
    this.tax += item.itemTax;
  }

  this.total = this.subtotal + this.tax;
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Cart", cartSchema);
