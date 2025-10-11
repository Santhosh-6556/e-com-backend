import mongoose from "mongoose";
import Product from "../models/addproduct.model.js";
import Tax from "../models/tax.model.js";


const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    basePrice: { type: Number },     
    totalPrice: { type: Number },     
    discount: { type: Number, default: 0 },
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


cartSchema.pre("save", async function (next) {
  this.itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = 0;
  this.discount = 0;
  this.tax = 0;

  for (let item of this.items) {
    const product = await Product.findOne({ recordId: item.productId });
    if (!product) continue;

    const basePrice = product.discountPrice || product.price;
    const originalTotal = product.price * item.quantity;
    const sellingTotal = basePrice * item.quantity;

    item.basePrice = basePrice;
    item.totalPrice = sellingTotal;
    item.discount = originalTotal - sellingTotal;

    let taxRate = 0;
    if (product.tax?.recordId) {
      const taxDoc = await Tax.findOne({
        recordId: product.tax.recordId,
        status: true,
      });
      if (taxDoc && taxDoc.rate) taxRate = parseFloat(taxDoc.rate);
    }

    item.itemTax = (item.totalPrice * taxRate) / 100;

    this.subtotal += item.totalPrice;
    this.discount += item.discount;
    this.tax += item.itemTax;
  }

  this.total = this.subtotal + this.tax;
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Cart", cartSchema);
