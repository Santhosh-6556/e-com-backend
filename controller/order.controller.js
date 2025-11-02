import mongoose from "mongoose";
import crypto from "crypto";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/addproduct.model.js";
import User from "../models/user.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";
import Razorpay from "razorpay";

// Function to get Razorpay instance
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }
  
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// Helper function to generate order ID
const generateOrderId = () => {
  return `ORD${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
};

// Create Order and Razorpay Order
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      userId, 
      shippingAddress, 
      paymentMethod,
      saveAddress = false 
    } = req.body;

    if (!userId || !shippingAddress) {
      return errorResponse(res, "User ID and shipping address are required", 400);
    }

    // 1. Get user cart
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) {
      return errorResponse(res, "Cart is empty", 400);
    }

    // 2. Validate stock and prices
    for (let item of cart.items) {
      const product = await Product.findOne({ recordId: item.productId }).session(session);
      if (!product) {
        await session.abortTransaction();
        return errorResponse(res, `Product ${item.productId} not found`, 404);
      }
      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return errorResponse(res, `Insufficient stock for ${product.identifier}`, 400);
      }
    }

    // 3. Save address to user profile if requested (WITH DUPLICATE CHECK)
    if (saveAddress) {
      const user = await User.findOne({ recordId: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        return errorResponse(res, "User not found", 404);
      }

      // Helper function to normalize addresses for comparison
      const normalizeAddress = (addr) => ({
        line1: (addr.line1 || '').toLowerCase().trim(),
        city: (addr.city || '').toLowerCase().trim(),
        pinCode: (addr.pinCode || '').toString().trim(),
        phone: (addr.phone || '').toString().trim(),
        firstName: (addr.firstName || '').toLowerCase().trim(),
        lastName: (addr.lastName || '').toLowerCase().trim()
      });

      const normalizedNewAddress = normalizeAddress(shippingAddress);
      
      const addressExists = user.addresses.some(existingAddr => {
        const normalizedExisting = normalizeAddress(existingAddr);
        return (
          normalizedExisting.line1 === normalizedNewAddress.line1 &&
          normalizedExisting.city === normalizedNewAddress.city &&
          normalizedExisting.pinCode === normalizedNewAddress.pinCode &&
          normalizedExisting.phone === normalizedNewAddress.phone
        );
      });

      if (!addressExists) {
        const isFirstAddress = user.addresses.length === 0;
        
        // If this is the first address or we want to make it default, remove default from others
        if (isFirstAddress) {
          user.addresses.forEach(addr => {
            addr.isDefaultDelivery = false;
          });
        }

        user.addresses.push({
          ...shippingAddress,
          recordId: generateRecordId(),
          isDefaultDelivery: isFirstAddress
        });

        await user.save({ session });
        console.log("New address saved to user profile");
      } else {
        console.log("Address already exists in user profile, skipping save");
      }
    }

    // 4. Generate IDs manually to ensure they're set
    const orderRecordId = generateRecordId();
    const orderId = generateOrderId();
    const transactionRecordId = generateRecordId();

    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findOne({ recordId: item.productId }).session(session);
        return {
          productId: product.identifier,
          productRecordId: product.recordId,
          name: product.identifier,
          images: product.images,
          quantity: item.quantity,
          basePrice: item.basePrice,
          totalPrice: item.totalPrice,
          discount: item.discount,
          tax: item.itemTax
        };
      })
    );

    // 5. Create order with all required fields
    const newOrder = new Order({
      recordId: orderRecordId,
      orderId: orderId,
      userId,
      items: orderItems,
      subtotal: cart.subtotal,
      discount: cart.discount,
      tax: cart.tax,
      shipping: 0,
      total: cart.total,
      shippingAddress,
      billingAddress: shippingAddress,
      orderStatus: "pending",
      deliveryMethod: "standard",
      transactions: [{
        recordId: transactionRecordId,
        paymentMethod,
        amount: cart.total,
        status: paymentMethod === "cod" ? "pending" : "pending"
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newOrder.save({ session });

    let razorpayOrder = null;

    // 6. Create Razorpay order for online payments
    if (paymentMethod !== "cod") {
      try {
        const razorpayInstance = getRazorpayInstance();
        
        const options = {
          amount: Math.round(cart.total * 100),
          currency: "INR",
          receipt: orderRecordId,
          notes: {
            userId,
            orderRecordId: orderRecordId
          }
        };

        razorpayOrder = await razorpayInstance.orders.create(options);
        
        newOrder.transactions[0].razorpayOrderId = razorpayOrder.id;
        await newOrder.save({ session });
        
      } catch (razorpayError) {
        await session.abortTransaction();
        console.error("Razorpay order creation failed:", razorpayError);
        return errorResponse(res, "Payment service unavailable. Please try COD or try again later.", 500);
      }
    }

    // 7. If COD, reserve stock and clear cart
    if (paymentMethod === "cod") {
      for (let item of cart.items) {
        await Product.findOneAndUpdate(
          { recordId: item.productId },
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }
      cart.items = [];
      await cart.save({ session });
    }

    await session.commitTransaction();

    const response = {
      order: newOrder,
      razorpayOrder: razorpayOrder || null
    };

    return successResponse(res, "Order created successfully", response);

  } catch (error) {
    await session.abortTransaction();
    console.error("Create Order Error:", error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    
    return errorResponse(res, "Failed to create order", 500);
  } finally {
    session.endSession();
  }
};

// Verify Razorpay Payment
export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderRecordId 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse(res, "Payment verification failed - missing parameters", 400);
    }

    // Verify payment signature using crypto (ES module syntax)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return errorResponse(res, "Payment verification failed - invalid signature", 400);
    }

    // Find order
    const order = await Order.findOne({ recordId: orderRecordId }).session(session);
    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Update order and transaction
    order.orderStatus = "confirmed";
    order.transactions[0].status = "success";
    order.transactions[0].razorpayPaymentId = razorpay_payment_id;
    order.transactions[0].razorpaySignature = razorpay_signature;
    order.updatedAt = new Date();

    await order.save({ session });

    // Clear cart and update stock (for online payments)
    const cart = await Cart.findOne({ userId: order.userId }).session(session);
    if (cart) {
      // Update stock
      for (let item of order.items) {
        await Product.findOneAndUpdate(
          { recordId: item.productRecordId },
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }
      // Clear cart
      cart.items = [];
      await cart.save({ session });
    }

    await session.commitTransaction();

    return successResponse(res, "Payment verified successfully", { order });

  } catch (error) {
    await session.abortTransaction();
    console.error("Verify Payment Error:", error);
    return errorResponse(res, "Payment verification failed", 500);
  } finally {
    session.endSession();
  }
};

// Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const orders = await Order.find({ recordId })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, "Orders retrieved successfully", orders);

  } catch (error) {
    console.error("Get User Orders Error:", error);
    return errorResponse(res, "Failed to retrieve orders", 500);
  }
};

// Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderRecordId, userId } = req.body;
    if (!orderRecordId || !userId) {
      return errorResponse(res, "Order ID and User ID are required", 400);
    }

    const order = await Order.findOne({ 
      recordId: orderRecordId, 
      userId 
    }).lean();

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    return successResponse(res, "Order details retrieved successfully", order);

  } catch (error) {
    console.error("Get Order Details Error:", error);
    return errorResponse(res, "Failed to retrieve order details", 500);
  }
};


// Cancel Order
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderRecordId, userId, reason } = req.body;
    if (!orderRecordId || !userId) {
      return errorResponse(res, "Order ID and User ID are required", 400);
    }

    const order = await Order.findOne({ 
      recordId: orderRecordId, 
      userId 
    }).session(session);

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Check if order can be cancelled
    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return errorResponse(res, "Order cannot be cancelled at this stage", 400);
    }

    // Restore stock
    for (let item of order.items) {
      await Product.findOneAndUpdate(
        { recordId: item.productRecordId },
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    // Update order status
    order.orderStatus = "cancelled";
    order.transactions[0].status = "refunded";
    await order.save({ session });

    await session.commitTransaction();

    return successResponse(res, "Order cancelled successfully", order);

  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel Order Error:", error);
    return errorResponse(res, "Failed to cancel order", 500);
  } finally {
    session.endSession();
  }
};


export const getAllOrders = async (req, res) => {
  try {
    // Fetch all orders
    const orders = await Order.find().sort({ creationTime: -1 });

    // Collect all user recordIds from orders
    const userRecordIds = orders.map((order) => order.userId);

    // Fetch corresponding users
    const users = await User.find({ recordId: { $in: userRecordIds } })
      .select("recordId name email phone addresses");

    // Merge user details into each order
    const mergedOrders = orders.map((order) => {
      const user = users.find((u) => u.recordId === order.userId);
      return {
        ...order.toObject(),
        userDetails: user || null,
      };
    });

    return successResponse(res, "Orders fetched successfully", mergedOrders);
  } catch (err) {
    console.error("Get Order Error:", err);
    return errorResponse(res, "Failed to fetch orders", 500);
  }
};
