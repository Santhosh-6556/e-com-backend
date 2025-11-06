// Order model for D1 database
import { getD1 } from "../config/d1.js";
import { generateRecordId } from "../utils/recordId.js";

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

const generateOrderId = () => {
  return `ORD${Date.now()}${Math.random()
    .toString(36)
    .substr(2, 5)}`.toUpperCase();
};

const rowToOrder = async (row) => {
  if (!row) return null;

  const db = getD1();

  // Get order items
  const items = await db.find("order_items", { orderRecordId: row.recordId });
  const orderItems = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productRecordId: item.productRecordId,
    name: item.name,
    images: parseJSON(item.images) || [],
    quantity: item.quantity,
    basePrice: item.basePrice,
    totalPrice: item.totalPrice,
    discount: item.discount || 0,
    tax: item.tax || 0,
  }));

  // Get addresses
  const addresses = await db.find("order_addresses", {
    orderRecordId: row.recordId,
  });
  const shippingAddress = addresses.find((a) => a.type === "shipping");
  const billingAddress = addresses.find((a) => a.type === "billing");

  const formatAddress = (addr) => {
    if (!addr) return null;
    return {
      recordId: addr.recordId,
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      email: addr.email,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      pinCode: addr.pinCode,
    };
  };

  // Get transactions
  const transactions = await db.find("transactions", {
    orderRecordId: row.recordId,
  });
  const formattedTransactions = transactions.map((txn) => ({
    recordId: txn.recordId,
    paymentMethod: txn.paymentMethod,
    amount: txn.amount,
    status: txn.status,
    razorpayOrderId: txn.razorpayOrderId,
    razorpayPaymentId: txn.razorpayPaymentId,
    razorpaySignature: txn.razorpaySignature,
    createdAt: txn.createdAt ? new Date(txn.createdAt * 1000) : new Date(),
  }));

  return {
    recordId: row.recordId,
    orderId: row.orderId,
    userId: row.userId,
    items: orderItems,
    subtotal: row.subtotal,
    discount: row.discount || 0,
    tax: row.tax || 0,
    shipping: row.shipping || 0,
    total: row.total,
    shippingAddress: formatAddress(shippingAddress),
    billingAddress: formatAddress(billingAddress),
    orderStatus: row.orderStatus || "pending",
    transactions: formattedTransactions,
    deliveryMethod: row.deliveryMethod || "standard",
    trackingNumber: row.trackingNumber,
    createdAt: row.createdAt ? new Date(row.createdAt * 1000) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt * 1000) : new Date(),
  };
};

class OrderModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const order = await this.db.findOne("orders", filter);
    if (!order) return null;
    return rowToOrder(order);
  }

  async find(filter = {}, options = {}) {
    const orders = await this.db.find("orders", filter, options);
    const results = [];
    for (const order of orders) {
      results.push(await rowToOrder(order));
    }
    return results;
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const recordId = data.recordId || generateRecordId();
    const orderId = data.orderId || generateOrderId();

    const orderData = {
      recordId,
      orderId,
      userId: data.userId,
      subtotal: data.subtotal,
      discount: data.discount || 0,
      tax: data.tax || 0,
      shipping: data.shipping || 0,
      total: data.total,
      orderStatus: data.orderStatus || "pending",
      deliveryMethod: data.deliveryMethod || "standard",
      trackingNumber: data.trackingNumber || null,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insertOne("orders", orderData);

    // Insert order items
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await this.db.insertOne("order_items", {
          orderRecordId: recordId,
          productId: item.productId,
          productRecordId: item.productRecordId,
          name: item.name,
          images: stringifyJSON(item.images),
          quantity: item.quantity,
          basePrice: item.basePrice,
          totalPrice: item.totalPrice,
          discount: item.discount || 0,
          tax: item.tax || 0,
        });
      }
    }

    // Insert addresses
    if (data.shippingAddress) {
      await this.db.insertOne("order_addresses", {
        orderRecordId: recordId,
        type: "shipping",
        recordId: data.shippingAddress.recordId || generateRecordId(),
        firstName: data.shippingAddress.firstName,
        lastName: data.shippingAddress.lastName,
        phone: data.shippingAddress.phone,
        email: data.shippingAddress.email,
        line1: data.shippingAddress.line1,
        line2: data.shippingAddress.line2,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        country: data.shippingAddress.country,
        pinCode: data.shippingAddress.pinCode,
      });
    }

    if (data.billingAddress) {
      await this.db.insertOne("order_addresses", {
        orderRecordId: recordId,
        type: "billing",
        recordId: data.billingAddress.recordId || generateRecordId(),
        firstName: data.billingAddress.firstName,
        lastName: data.billingAddress.lastName,
        phone: data.billingAddress.phone,
        email: data.billingAddress.email,
        line1: data.billingAddress.line1,
        line2: data.billingAddress.line2,
        city: data.billingAddress.city,
        state: data.billingAddress.state,
        country: data.billingAddress.country,
        pinCode: data.billingAddress.pinCode,
      });
    }

    // Insert transactions
    if (data.transactions && data.transactions.length > 0) {
      for (const txn of data.transactions) {
        const txnRecordId = txn.recordId || generateRecordId();
        await this.db.insertOne("transactions", {
          recordId: txnRecordId,
          orderRecordId: recordId,
          paymentMethod: txn.paymentMethod,
          amount: txn.amount,
          status: txn.status || "pending",
          razorpayOrderId: txn.razorpayOrderId || null,
          razorpayPaymentId: txn.razorpayPaymentId || null,
          razorpaySignature: txn.razorpaySignature || null,
          createdAt: txn.createdAt
            ? Math.floor(new Date(txn.createdAt).getTime() / 1000)
            : now,
        });
      }
    }

    return this.findOne({ recordId });
  }

  async updateOne(filter, update) {
    const updateData = { ...update, updatedAt: Math.floor(Date.now() / 1000) };
    await this.db.updateOne("orders", filter, updateData);
    return this.findOne(filter);
  }

  async addTransaction(orderRecordId, transactionData) {
    const now = Math.floor(Date.now() / 1000);
    const recordId = transactionData.recordId || generateRecordId();

    await this.db.insertOne("transactions", {
      recordId,
      orderRecordId,
      paymentMethod: transactionData.paymentMethod,
      amount: transactionData.amount,
      status: transactionData.status || "pending",
      razorpayOrderId: transactionData.razorpayOrderId || null,
      razorpayPaymentId: transactionData.razorpayPaymentId || null,
      razorpaySignature: transactionData.razorpaySignature || null,
      createdAt: now,
    });

    return this.findOne({ recordId: orderRecordId });
  }

  async deleteOne(filter) {
    const order = await this.db.findOne("orders", filter);
    if (order) {
      await this.db.deleteMany("order_items", {
        orderRecordId: order.recordId,
      });
      await this.db.deleteMany("order_addresses", {
        orderRecordId: order.recordId,
      });
      await this.db.deleteMany("transactions", {
        orderRecordId: order.recordId,
      });
    }
    await this.db.deleteOne("orders", filter);
    return true;
  }
}

let orderModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!orderModelInstance) orderModelInstance = new OrderModel();
    return orderModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!orderModelInstance) orderModelInstance = new OrderModel();
    return orderModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!orderModelInstance) orderModelInstance = new OrderModel();
    return orderModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!orderModelInstance) orderModelInstance = new OrderModel();
    return orderModelInstance.updateOne(filter, update);
  },
  addTransaction: async (orderRecordId, transactionData) => {
    if (!orderModelInstance) orderModelInstance = new OrderModel();
    return orderModelInstance.addTransaction(orderRecordId, transactionData);
  },
  deleteOne: async (filter) => {
    if (!orderModelInstance) orderModelInstance = new OrderModel();
    return orderModelInstance.deleteOne(filter);
  },
};
