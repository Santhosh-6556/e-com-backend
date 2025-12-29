// Wishlist model for D1 database
import { getD1 } from "../config/d1.js";

const rowToWishlist = async (row) => {
  if (!row) return null;

  const db = getD1();
  const items = await db.find("wishlist_items", {
    wishlistUserRecordId: row.userRecordId,
  });

  const wishlistItems = items.map((item) => ({
    productRecordId: item.productRecordId,
    addedAt: item.addedAt ? new Date(item.addedAt * 1000) : new Date(),
  }));

  return {
    userRecordId: row.userRecordId,
    items: wishlistItems,
    itemCount: row.itemCount || 0,
    createdAt: row.createdAt ? new Date(row.createdAt * 1000) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt * 1000) : new Date(),
  };
};

class WishlistModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const wishlist = await this.db.findOne("wishlists", filter);
    if (!wishlist) return null;
    return rowToWishlist(wishlist);
  }

  async find(filter = {}, options = {}) {
    const wishlists = await this.db.find("wishlists", filter, options);
    const results = [];
    for (const wishlist of wishlists) {
      results.push(await rowToWishlist(wishlist));
    }
    return results;
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const wishlistData = {
      userRecordId: data.userRecordId,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.insertOne("wishlists", wishlistData);
    return this.findOne({ userRecordId: data.userRecordId });
  }

  async addItem(userRecordId, productRecordId) {
    // Create wishlist if it doesn't exist
    let wishlist = await this.findOne({ userRecordId });
    if (!wishlist) {
      await this.create({ userRecordId });
    }

    // Check if item already exists
    const existing = await this.db.findOne("wishlist_items", {
      wishlistUserRecordId: userRecordId,
      productRecordId,
    });
    if (existing) return this.findOne({ userRecordId });

    const now = Math.floor(Date.now() / 1000);
    await this.db.insertOne("wishlist_items", {
      wishlistUserRecordId: userRecordId,
      productRecordId,
      addedAt: now,
    });

    await this.updateItemCount(userRecordId);
    return this.findOne({ userRecordId });
  }

  async removeItem(userRecordId, productRecordId) {
    await this.db.deleteOne("wishlist_items", {
      wishlistUserRecordId: userRecordId,
      productRecordId,
    });
    await this.updateItemCount(userRecordId);
    return this.findOne({ userRecordId });
  }

  async updateItemCount(userRecordId) {
    const items = await this.db.find("wishlist_items", {
      wishlistUserRecordId: userRecordId,
    });
    const itemCount = items.length;
    const now = Math.floor(Date.now() / 1000);
    await this.db.updateOne(
      "wishlists",
      { userRecordId },
      { itemCount, updatedAt: now }
    );
  }

  async updateOne(filter, update) {
    const updateData = { ...update, updatedAt: Math.floor(Date.now() / 1000) };
    await this.db.updateOne("wishlists", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    const wishlist = await this.db.findOne("wishlists", filter);
    if (wishlist) {
      await this.db.deleteMany("wishlist_items", {
        wishlistUserRecordId: wishlist.userRecordId,
      });
    }
    await this.db.deleteOne("wishlists", filter);
    return true;
  }
}

let wishlistModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!wishlistModelInstance) wishlistModelInstance = new WishlistModel();
    return wishlistModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!wishlistModelInstance) wishlistModelInstance = new WishlistModel();
    return wishlistModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!wishlistModelInstance) wishlistModelInstance = new WishlistModel();
    return wishlistModelInstance.create(data);
  },
  addItem: async (userRecordId, productRecordId) => {
    if (!wishlistModelInstance) wishlistModelInstance = new WishlistModel();
    return wishlistModelInstance.addItem(userRecordId, productRecordId);
  },
  removeItem: async (userRecordId, productRecordId) => {
    if (!wishlistModelInstance) wishlistModelInstance = new WishlistModel();
    return wishlistModelInstance.removeItem(userRecordId, productRecordId);
  },
  updateOne: async (filter, update) => {
    if (!wishlistModelInstance) wishlistModelInstance = new WishlistModel();
    return wishlistModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!wishlistModelInstance) wishlistModelInstance = new WishlistModel();
    return wishlistModelInstance.deleteOne(filter);
  },
};
