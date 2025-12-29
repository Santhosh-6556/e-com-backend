import { getD1 } from "../config/d1.js";

const rowToBrand = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    identifier: row.identifier,
    name: row.name,
    shortDescription: row.shortDescription,
    image: row.image,
    displayPriority: row.displayPriority || 0,
    status: row.status === 1,
    creator: row.creator,
    creationTime: row.creationTime
      ? new Date(row.creationTime * 1000)
      : new Date(),
    lastModified: row.lastModified
      ? new Date(row.lastModified * 1000)
      : new Date(),
  };
};

class BrandModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const brand = await this.db.findOne("brands", filter);
    return brand ? rowToBrand(brand) : null;
  }

  async find(filter = {}, options = {}) {
    const brands = await this.db.find("brands", filter, options);
    return brands.map(rowToBrand);
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const brandData = {
      recordId: data.recordId,
      identifier: data.identifier,
      name: data.name || null,
      shortDescription: data.shortDescription || null,
      image: data.image || null,
      displayPriority: data.displayPriority || 0,
      status: data.status !== false ? 1 : 0,
      creator: data.creator || null,
      creationTime: now,
      lastModified: now,
    };
    await this.db.insertOne("brands", brandData);
    return this.findOne({ recordId: data.recordId });
  }

  async updateOne(filter, update) {
    const updateData = {
      ...update,
      lastModified: Math.floor(Date.now() / 1000),
    };
    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;
    await this.db.updateOne("brands", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("brands", filter);
    return true;
  }
}

let brandModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!brandModelInstance) brandModelInstance = new BrandModel();
    return brandModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!brandModelInstance) brandModelInstance = new BrandModel();
    return brandModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!brandModelInstance) brandModelInstance = new BrandModel();
    return brandModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!brandModelInstance) brandModelInstance = new BrandModel();
    return brandModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!brandModelInstance) brandModelInstance = new BrandModel();
    return brandModelInstance.deleteOne(filter);
  },
};
