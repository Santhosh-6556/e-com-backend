import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  recordId: { type: String, required: true },
  paymentMethod: { 
    type: String, 
    enum: ["card", "upi", "cod", "razorpay"],
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "success", "failed", "refunded"],
    default: "pending"
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productRecordId: { type: String, required: true },
  name: { type: String, required: true },
  images: [{ type: String }],
  quantity: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }
}, { _id: true });

const addressSchema = new mongoose.Schema({
  recordId: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pinCode: { type: String, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },
  orderId: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return `ORD${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    }
  },
  userId: { type: String, required: true, index: true },
  
  // Order Items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total: { type: Number, required: true },
  
  // Address
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  
  // Order Status
  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  
  // Payment
  transactions: [transactionSchema],
  
  // Delivery
  deliveryMethod: { type: String, default: "standard" },
  trackingNumber: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to generate orderId and update timestamps
orderSchema.pre("save", function(next) {
  // Generate orderId if not present
  if (!this.orderId) {
    this.orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  }
  
  // Generate recordId if not present
  if (!this.recordId) {
    this.recordId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware for transactions
orderSchema.pre("save", function(next) {
  // Ensure each transaction has a recordId
  if (this.transactions && this.transactions.length > 0) {
    this.transactions.forEach(transaction => {
      if (!transaction.recordId) {
        transaction.recordId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    });
  }
  next();
});

export default mongoose.model("Order", orderSchema);