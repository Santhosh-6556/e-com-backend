import Cart from "../models/cart.model.js";
import Product from "../models/addproduct.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        recordId: generateRecordId(),
        userId: userId,
        items: [],
        itemsCount: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      });
    }

    const response = {
      cartId: cart.recordId,
      items: cart.items.map((item) => ({
        id: item._id,
        product: {
          recordId: item.product.recordId,
          name: item.product.name,
          identifier: item.product.identifier,
          slug: item.product.slug,
          price: item.product.price,
          discountPrice: item.product.discountPrice,
          images: item.product.images,
          stock: item.product.stock,
          status: item.product.status,
        },
        quantity: item.quantity,
        selectedAttributes: item.selectedAttributes,
        itemTotal: item.itemTotal,
      })),
      summary: {
        itemsCount: cart.itemsCount,
        subtotal: cart.subtotal,
        discount: cart.discount,
        tax: cart.tax,
        total: cart.total,
      },
    };

    return successResponse(res, "Cart retrieved successfully", response);
  } catch (error) {
    console.error("GetCart Error:", error);
    return errorResponse(res, "Failed to retrieve cart", 500);
  }
};

export const addToCart = async (req, res) => {
  try {
    const { userId, productRecordId, quantity = 1 } = req.body;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    if (!productRecordId) {
      return errorResponse(res, "Product record ID is required", 400);
    }

    const product = await Product.findOne({
      recordId: productRecordId,
      status: true,
      stock: { $gt: 0 },
    });

    if (!product) {
      return errorResponse(res, "Product not found or out of stock", 404);
    }

    const itemQuantity = Math.max(1, parseInt(quantity) || 1);

    if (product.stock < itemQuantity) {
      return errorResponse(
        res,
        `Only ${product.stock} items available in stock`,
        400
      );
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        recordId: generateRecordId(),
        userId: userId,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.recordId === productRecordId
    );

    const sellingPrice = product.discountPrice || product.price;
    const itemTotal = sellingPrice * itemQuantity;

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + itemQuantity;

      if (product.stock < newQuantity) {
        return errorResponse(
          res,
          `Cannot add more than ${product.stock} items`,
          400
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].itemTotal = sellingPrice * newQuantity;
    } else {
      const cartProduct = {
        recordId: product.recordId,
        name: product.name,
        identifier: product.identifier,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        images: product.images,
        stock: product.stock,
        status: product.status,
        taxRecordId: product.tax?.recordId || null,
      };

      cart.items.push({
        product: cartProduct,
        quantity: itemQuantity,
        selectedAttributes: [],
        itemTotal: itemTotal,
      });
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ userId });
    const response = {
      cartId: updatedCart.recordId,
      items: updatedCart.items.map((item) => ({
        id: item._id,
        product: {
          recordId: item.product.recordId,
          name: item.product.name,
          identifier: item.product.identifier,
          slug: item.product.slug,
          price: item.product.price,
          discountPrice: item.product.discountPrice,
          images: item.product.images,
          stock: item.product.stock,
          status: item.product.status,
        },
        quantity: item.quantity,
        selectedAttributes: item.selectedAttributes,
        itemTotal: item.itemTotal,
      })),
      summary: {
        itemsCount: updatedCart.itemsCount,
        subtotal: updatedCart.subtotal,
        discount: updatedCart.discount,
        tax: updatedCart.tax,
        total: updatedCart.total,
      },
    };

    return successResponse(res, "Item added to cart successfully", response);
  } catch (error) {
    console.error("AddToCart Error:", error);
    return errorResponse(res, "Failed to add item to cart", 500);
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { userId, productRecordId, quantity } = req.body;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    if (!productRecordId || quantity === undefined) {
      return errorResponse(
        res,
        "Product record ID and quantity are required",
        400
      );
    }

    const itemQuantity = parseInt(quantity);

    if (itemQuantity < 1) {
      return errorResponse(res, "Quantity must be at least 1", 400);
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return errorResponse(res, "Cart not found", 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.recordId === productRecordId
    );

    if (itemIndex === -1) {
      return errorResponse(res, "Item not found in cart", 404);
    }

    const product = await Product.findOne({
      recordId: productRecordId,
      status: true,
    });

    if (!product) {
      return errorResponse(res, "Product no longer available", 404);
    }

    if (product.stock < itemQuantity) {
      return errorResponse(
        res,
        `Only ${product.stock} items available in stock`,
        400
      );
    }

    const sellingPrice = product.discountPrice || product.price;
    cart.items[itemIndex].quantity = itemQuantity;
    cart.items[itemIndex].itemTotal = sellingPrice * itemQuantity;

    await cart.save();

    const updatedCart = await Cart.findOne({ userId });
    const response = {
      cartId: updatedCart.recordId,
      items: updatedCart.items.map((item) => ({
        id: item._id,
        product: {
          recordId: item.product.recordId,
          name: item.product.name,
          identifier: item.product.identifier,
          slug: item.product.slug,
          price: item.product.price,
          discountPrice: item.product.discountPrice,
          images: item.product.images,
          stock: item.product.stock,
          status: item.product.status,
        },
        quantity: item.quantity,
        selectedAttributes: item.selectedAttributes,
        itemTotal: item.itemTotal,
      })),
      summary: {
        itemsCount: updatedCart.itemsCount,
        subtotal: updatedCart.subtotal,
        discount: updatedCart.discount,
        tax: updatedCart.tax,
        total: updatedCart.total,
      },
    };

    return successResponse(res, "Cart item updated successfully", response);
  } catch (error) {
    console.error("UpdateCartItem Error:", error);
    return errorResponse(res, "Failed to update cart item", 500);
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { userId, productRecordId } = req.body;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    if (!productRecordId) {
      return errorResponse(res, "Product record ID is required", 400);
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return errorResponse(res, "Cart not found", 404);
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.recordId !== productRecordId
    );

    if (cart.items.length === initialLength) {
      return errorResponse(res, "Item not found in cart", 404);
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ userId });
    const response = {
      cartId: updatedCart.recordId,
      items: updatedCart.items.map((item) => ({
        id: item._id,
        product: {
          recordId: item.product.recordId,
          name: item.product.name,
          identifier: item.product.identifier,
          slug: item.product.slug,
          price: item.product.price,
          discountPrice: item.product.discountPrice,
          images: item.product.images,
          stock: item.product.stock,
          status: item.product.status,
        },
        quantity: item.quantity,
        selectedAttributes: item.selectedAttributes,
        itemTotal: item.itemTotal,
      })),
      summary: {
        itemsCount: updatedCart.itemsCount,
        subtotal: updatedCart.subtotal,
        discount: updatedCart.discount,
        tax: updatedCart.tax,
        total: updatedCart.total,
      },
    };

    return successResponse(
      res,
      "Item removed from cart successfully",
      response
    );
  } catch (error) {
    console.error("RemoveFromCart Error:", error);
    return errorResponse(res, "Failed to remove item from cart", 500);
  }
};

export const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return errorResponse(res, "Cart not found", 404);
    }

    cart.items = [];
    await cart.save();

    const response = {
      cartId: cart.recordId,
      items: [],
      summary: {
        itemsCount: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    };

    return successResponse(res, "Cart cleared successfully", response);
  } catch (error) {
    console.error("ClearCart Error:", error);
    return errorResponse(res, "Failed to clear cart", 500);
  }
};
