// User model for D1 database
import { getD1 } from "../config/d1.js";
import { generateRecordId } from "../utils/recordId.js";

// Helper function to parse JSON fields
const parseJSON = (value) => {
  if (!value) return null;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};

// Helper function to stringify JSON fields
const stringifyJSON = (value) => {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
};

// Convert database row to user object
const rowToUser = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    name: row.name,
    email: row.email,
    password: row.password,
    dob: row.dob,
    role: row.role || "user",
    phone: row.phone,
    isActive: row.isActive === 1,
    otp: row.otp,
    otpExpires: row.otpExpires ? new Date(row.otpExpires * 1000) : null,
    otpLastSent: row.otpLastSent ? new Date(row.otpLastSent * 1000) : null,
    otpAttempts: row.otpAttempts || 0,
    createdAt: row.createdAt ? new Date(row.createdAt * 1000) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt * 1000) : new Date(),
  };
};

// User model class
class UserModel {
  constructor() {
    this.db = getD1();
  }

  // Find one user
  async findOne(filter) {
    const user = await this.db.findOne("users", filter);
    if (!user) return null;

    const userObj = rowToUser(user);

    // Get addresses
    const addresses = await this.db.find("user_addresses", {
      userId: user.recordId,
    });
    userObj.addresses = addresses.map((addr) => ({
      recordId: addr.recordId,
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      email: addr.email,
      line1: addr.line1,
      line2: addr.line2,
      addressType: addr.addressType,
      pinCode: addr.pinCode,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      isDefaultDelivery: addr.isDefaultDelivery === 1,
    }));

    return userObj;
  }

  // Find multiple users
  async find(filter = {}, options = {}) {
    const users = await this.db.find("users", filter, options);
    return users.map(rowToUser);
  }

  // Create user
  async create(data) {
    const recordId = data.recordId || generateRecordId();
    const now = Math.floor(Date.now() / 1000);

    const userData = {
      recordId,
      name: data.name || null,
      email: data.email.toLowerCase(),
      password: data.password || null,
      dob: data.dob || null,
      role: data.role || "user",
      phone: data.phone || null,
      isActive: data.isActive !== false ? 1 : 0,
      otp: data.otp || null,
      otpExpires: data.otpExpires
        ? Math.floor(new Date(data.otpExpires).getTime() / 1000)
        : null,
      otpLastSent: data.otpLastSent
        ? Math.floor(new Date(data.otpLastSent).getTime() / 1000)
        : null,
      otpAttempts: data.otpAttempts || 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insertOne("users", userData);
    return this.findOne({ recordId });
  }

  // Update user
  async updateOne(filter, update) {
    const updateData = { ...update, updatedAt: Math.floor(Date.now() / 1000) };

    // Handle date fields
    if (update.otpExpires) {
      updateData.otpExpires = Math.floor(
        new Date(update.otpExpires).getTime() / 1000
      );
    }
    if (update.otpLastSent) {
      updateData.otpLastSent = Math.floor(
        new Date(update.otpLastSent).getTime() / 1000
      );
    }
    if (update.isActive !== undefined) {
      updateData.isActive = update.isActive ? 1 : 0;
    }
    if (update.email) {
      updateData.email = update.email.toLowerCase();
    }

    await this.db.updateOne("users", filter, updateData);
    return this.findOne(filter);
  }

  // Save user (update if exists, create if not)
  async save(user) {
    if (user.recordId) {
      return this.updateOne({ recordId: user.recordId }, user);
    } else {
      return this.create(user);
    }
  }

  // Add address
  async addAddress(userId, addressData) {
    const recordId = addressData.recordId || generateRecordId();
    const now = Math.floor(Date.now() / 1000);

    // If this is default, unset others
    if (addressData.isDefaultDelivery) {
      await this.db.updateMany(
        "user_addresses",
        { userId },
        { isDefaultDelivery: 0 }
      );
    }

    const address = {
      recordId,
      userId,
      firstName: addressData.firstName,
      lastName: addressData.lastName,
      phone: addressData.phone,
      email: addressData.email,
      line1: addressData.line1,
      line2: addressData.line2,
      addressType: addressData.addressType,
      pinCode: addressData.pinCode,
      city: addressData.city,
      state: addressData.state,
      country: addressData.country,
      isDefaultDelivery: addressData.isDefaultDelivery ? 1 : 0,
      createdAt: now,
    };

    await this.db.insertOne("user_addresses", address);
    return { ...address, isDefaultDelivery: address.isDefaultDelivery === 1 };
  }

  // Update address
  async updateAddress(userId, addressRecordId, updateData) {
    // If setting as default, unset others
    if (updateData.isDefaultDelivery) {
      await this.db.updateMany(
        "user_addresses",
        { userId },
        { isDefaultDelivery: 0 }
      );
    }

    const update = { ...updateData };
    if (update.isDefaultDelivery !== undefined) {
      update.isDefaultDelivery = update.isDefaultDelivery ? 1 : 0;
    }

    await this.db.updateOne(
      "user_addresses",
      { userId, recordId: addressRecordId },
      update
    );

    return this.db.findOne("user_addresses", {
      userId,
      recordId: addressRecordId,
    });
  }

  // Delete address
  async deleteAddress(userId, addressRecordId) {
    await this.db.deleteOne("user_addresses", {
      userId,
      recordId: addressRecordId,
    });
    return true;
  }
}

// Export singleton instance
let userModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!userModelInstance) userModelInstance = new UserModel();
    return userModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!userModelInstance) userModelInstance = new UserModel();
    return userModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!userModelInstance) userModelInstance = new UserModel();
    return userModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!userModelInstance) userModelInstance = new UserModel();
    return userModelInstance.updateOne(filter, update);
  },
  save: async (user) => {
    if (!userModelInstance) userModelInstance = new UserModel();
    return userModelInstance.save(user);
  },
  addAddress: async (userId, addressData) => {
    if (!userModelInstance) userModelInstance = new UserModel();
    return userModelInstance.addAddress(userId, addressData);
  },
  updateAddress: async (userId, addressRecordId, updateData) => {
    if (!userModelInstance) userModelInstance = new UserModel();
    return userModelInstance.updateAddress(userId, addressRecordId, updateData);
  },
  deleteAddress: async (userId, addressRecordId) => {
    if (!userModelInstance) userModelInstance = new UserModel();
    return userModelInstance.deleteAddress(userId, addressRecordId);
  },
};
