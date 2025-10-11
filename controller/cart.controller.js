import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Product from "../models/addproduct.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";

const formatCartResponse = async (cart) => {
  const items = await Promise.all(
    cart.items.map(async (item) => {
      const product = await Product.findOne({ recordId: item.productId });
      if (!product) return null;

      const quantity = item.quantity;
      const originalPrice = product.price * quantity;
      const discountPrice = (product.discountPrice || product.price) * quantity;
      const discount = originalPrice - discountPrice;

      let taxRate = 0;
      if (product.tax?.recordId) {
        const taxDoc = await mongoose.model("Tax").findOne({
          recordId: product.tax.recordId,
          status: true,
        });
        if (taxDoc && taxDoc.rate) taxRate = parseFloat(taxDoc.rate);
      }

      const itemTax = (discountPrice * taxRate) / 100;
      const subtotal = discountPrice;
      const total = subtotal + itemTax;

      return {
        id: item._id,
        productId: product.recordId,
        name: product.identifier,
        slug: product.slug,
        quantity,
        images: product.images,
        originalPrice,
        discountPrice,
        discount,
        tax: itemTax,
        subtotal,
        total,
      };
    })
  );

  const validItems = items.filter(Boolean);

  const summary = {
    itemsCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
    originalPrice: validItems.reduce((sum, i) => sum + i.originalPrice, 0),
    discountPrice: validItems.reduce((sum, i) => sum + i.discountPrice, 0),
    discount: validItems.reduce((sum, i) => sum + i.discount, 0),
    tax: validItems.reduce((sum, i) => sum + i.tax, 0),
    subtotal: validItems.reduce((sum, i) => sum + i.subtotal, 0),
    total: validItems.reduce((sum, i) => sum + i.total, 0),
  };

  return {
    cartId: cart.recordId,
    userId: cart.userId,
    items: validItems,
    summary,
  };
};

export const getCart = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return errorResponse(res, "User ID is required", 400);

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({
        recordId: generateRecordId(),
        userId,
        items: [],
      });
    }

    const response = await formatCartResponse(cart);
    return successResponse(res, "Cart retrieved successfully", response);
  } catch (err) {
    console.error("GetCart Error:", err);
    return errorResponse(res, "Failed to retrieve cart", 500);
  }
};

export const addToCart = async (req, res) => {
  try {
    const { userId, productRecordId, quantity = 1 } = req.body;
    if (!userId || !productRecordId)
      return errorResponse(res, "User ID and product ID are required", 400);

    const product = await Product.findOne({
      recordId: productRecordId,
      status: true,
    });
    if (!product)
      return errorResponse(res, "Product not found or inactive", 404);

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ recordId: generateRecordId(), userId, items: [] });
    }

    const existingItem = cart.items.find(
      (i) => i.productId === productRecordId
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId: productRecordId, quantity });
    }

    await cart.save();

    const response = await formatCartResponse(cart);
    return successResponse(res, "Item added to cart successfully", response);
  } catch (err) {
    console.error("AddToCart Error:", err);
    return errorResponse(res, "Failed to add item to cart", 500);
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { userId, productRecordId, quantity } = req.body;
    if (!userId || !productRecordId || quantity === undefined)
      return errorResponse(
        res,
        "User ID, product ID and quantity are required",
        400
      );

    const cart = await Cart.findOne({ userId });
    if (!cart) return errorResponse(res, "Cart not found", 404);

    const item = cart.items.find((i) => i.productId === productRecordId);
    if (!item) return errorResponse(res, "Item not found in cart", 404);

    item.quantity = quantity;
    await cart.save();

    const response = await formatCartResponse(cart);
    return successResponse(res, "Cart item updated successfully", response);
  } catch (err) {
    console.error("UpdateCartItem Error:", err);
    return errorResponse(res, "Failed to update cart item", 500);
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { userId, productRecordId } = req.body;
    if (!userId || !productRecordId)
      return errorResponse(res, "User ID and product ID are required", 400);

    const cart = await Cart.findOne({ userId });
    if (!cart) return errorResponse(res, "Cart not found", 404);

    cart.items = cart.items.filter((i) => i.productId !== productRecordId);
    await cart.save();

    const response = await formatCartResponse(cart);
    return successResponse(
      res,
      "Item removed from cart successfully",
      response
    );
  } catch (err) {
    console.error("RemoveFromCart Error:", err);
    return errorResponse(res, "Failed to remove item from cart", 500);
  }
};

export const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return errorResponse(res, "User ID is required", 400);

    const cart = await Cart.findOne({ userId });
    if (!cart) return errorResponse(res, "Cart not found", 404);

    cart.items = [];
    await cart.save();

    const response = {
      cartId: cart.recordId,
      items: [],
      summary: {
        itemsCount: 0,
        originalPrice: 0,
        discountPrice: 0,
        discount: 0,
        tax: 0,
        subtotal: 0,
        total: 0,
      },
    };

    return successResponse(res, "Cart cleared successfully", response);
  } catch (err) {
    console.error("ClearCart Error:", err);
    return errorResponse(res, "Failed to clear cart", 500);
  }
};
