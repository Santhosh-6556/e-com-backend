// Cart model for D1 database
import { getD1 } from "../config/d1.js";
import Product from "./product.model.js";
import Tax from "./tax.model.js";

const parseJSON = (value) => {
  if (!value) return null;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};

const stringifyJSON = (value) => {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
};

const rowToCart = async (row) => {
  if (!row) return null;

  // Get cart items
  const db = getD1();
  const items = await db.find("cart_items", { cartRecordId: row.recordId });

  const cartItems = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    basePrice: item.basePrice,
    totalPrice: item.totalPrice,
    discount: item.discount || 0,
    itemTax: item.itemTax || 0,
  }));

  return {
    recordId: row.recordId,
    userId: row.userId,
    items: cartItems,
    itemsCount: row.itemsCount || 0,
    subtotal: row.subtotal || 0,
    discount: row.discount || 0,
    tax: row.tax || 0,
    total: row.total || 0,
    createdAt: row.createdAt ? new Date(row.createdAt * 1000) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt * 1000) : new Date(),
  };
};

class CartModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const cart = await this.db.findOne("carts", filter);
    if (!cart) return null;
    return rowToCart(cart);
  }

  async find(filter = {}, options = {}) {
    const carts = await this.db.find("carts", filter, options);
    const results = [];
    for (const cart of carts) {
      results.push(await rowToCart(cart));
    }
    return results;
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const cartData = {
      recordId: data.recordId,
      userId: data.userId,
      itemsCount: 0,
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.insertOne("carts", cartData);
    return this.findOne({ recordId: data.recordId });
  }

  async addItem(cartRecordId, itemData) {
    // Calculate prices
    const product = await Product.findOne({ recordId: itemData.productId });
    if (!product) throw new Error("Product not found");

    const basePrice = product.discountPrice || product.price;
    const originalTotal = product.price * itemData.quantity;
    const sellingTotal = basePrice * itemData.quantity;
    const discount = originalTotal - sellingTotal;

    let taxRate = 0;
    if (product.tax?.recordId) {
      const taxDoc = await Tax.findOne({
        recordId: product.tax.recordId,
        status: true,
      });
      if (taxDoc && taxDoc.rate) taxRate = parseFloat(taxDoc.rate);
    }
    const itemTax = (sellingTotal * taxRate) / 100;

    const cartItem = {
      cartRecordId,
      productId: itemData.productId,
      quantity: itemData.quantity,
      basePrice,
      totalPrice: sellingTotal,
      discount,
      itemTax,
    };
    await this.db.insertOne("cart_items", cartItem);

    // Recalculate cart totals
    await this.recalculateTotals(cartRecordId);
    return this.findOne({ recordId: cartRecordId });
  }

  async updateItem(cartRecordId, itemId, update) {
    if (update.quantity !== undefined) {
      const item = await this.db.findOne("cart_items", {
        id: itemId,
        cartRecordId,
      });
      if (!item) throw new Error("Cart item not found");

      const product = await Product.findOne({ recordId: item.productId });
      if (!product) throw new Error("Product not found");

      const basePrice = product.discountPrice || product.price;
      const originalTotal = product.price * update.quantity;
      const sellingTotal = basePrice * update.quantity;
      const discount = originalTotal - sellingTotal;

      let taxRate = 0;
      if (product.tax?.recordId) {
        const taxDoc = await Tax.findOne({
          recordId: product.tax.recordId,
          status: true,
        });
        if (taxDoc && taxDoc.rate) taxRate = parseFloat(taxDoc.rate);
      }
      const itemTax = (sellingTotal * taxRate) / 100;

      await this.db.updateOne(
        "cart_items",
        { id: itemId, cartRecordId },
        {
          quantity: update.quantity,
          basePrice,
          totalPrice: sellingTotal,
          discount,
          itemTax,
        }
      );
    }

    await this.recalculateTotals(cartRecordId);
    return this.findOne({ recordId: cartRecordId });
  }

  async removeItem(cartRecordId, itemId) {
    await this.db.deleteOne("cart_items", { id: itemId, cartRecordId });
    await this.recalculateTotals(cartRecordId);
    return this.findOne({ recordId: cartRecordId });
  }

  async recalculateTotals(cartRecordId) {
    const items = await this.db.find("cart_items", { cartRecordId });

    let itemsCount = 0;
    let subtotal = 0;
    let discount = 0;
    let tax = 0;

    for (const item of items) {
      itemsCount += item.quantity;
      subtotal += item.totalPrice || 0;
      discount += item.discount || 0;
      tax += item.itemTax || 0;
    }

    const total = subtotal + tax;
    const now = Math.floor(Date.now() / 1000);

    await this.db.updateOne(
      "carts",
      { recordId: cartRecordId },
      {
        itemsCount,
        subtotal,
        discount,
        tax,
        total,
        updatedAt: now,
      }
    );
  }

  async updateOne(filter, update) {
    const updateData = { ...update, updatedAt: Math.floor(Date.now() / 1000) };
    await this.db.updateOne("carts", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    // Delete cart items first
    const cart = await this.db.findOne("carts", filter);
    if (cart) {
      await this.db.deleteMany("cart_items", { cartRecordId: cart.recordId });
    }
    await this.db.deleteOne("carts", filter);
    return true;
  }
}

let cartModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!cartModelInstance) cartModelInstance = new CartModel();
    return cartModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!cartModelInstance) cartModelInstance = new CartModel();
    return cartModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!cartModelInstance) cartModelInstance = new CartModel();
    return cartModelInstance.create(data);
  },
  addItem: async (cartRecordId, itemData) => {
    if (!cartModelInstance) cartModelInstance = new CartModel();
    return cartModelInstance.addItem(cartRecordId, itemData);
  },
  updateItem: async (cartRecordId, itemId, update) => {
    if (!cartModelInstance) cartModelInstance = new CartModel();
    return cartModelInstance.updateItem(cartRecordId, itemId, update);
  },
  removeItem: async (cartRecordId, itemId) => {
    if (!cartModelInstance) cartModelInstance = new CartModel();
    return cartModelInstance.removeItem(cartRecordId, itemId);
  },
  updateOne: async (filter, update) => {
    if (!cartModelInstance) cartModelInstance = new CartModel();
    return cartModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!cartModelInstance) cartModelInstance = new CartModel();
    return cartModelInstance.deleteOne(filter);
  },
};
