// Tax model for D1 database
import { getD1 } from "../config/d1.js";

const rowToTax = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    identifier: row.identifier,
    rate: row.rate,
    status: row.status === 1,
  };
};

class TaxModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const tax = await this.db.findOne("taxes", filter);
    return tax ? rowToTax(tax) : null;
  }

  async find(filter = {}, options = {}) {
    const taxes = await this.db.find("taxes", filter, options);
    return taxes.map(rowToTax);
  }

  async create(data) {
    const taxData = {
      recordId: data.recordId,
      identifier: data.identifier,
      rate: data.rate || null,
      status: data.status !== false ? 1 : 0,
    };
    await this.db.insertOne("taxes", taxData);
    return this.findOne({ recordId: data.recordId });
  }

  async updateOne(filter, update) {
    const updateData = { ...update };
    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;
    await this.db.updateOne("taxes", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("taxes", filter);
    return true;
  }
}

let taxModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!taxModelInstance) taxModelInstance = new TaxModel();
    return taxModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!taxModelInstance) taxModelInstance = new TaxModel();
    return taxModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!taxModelInstance) taxModelInstance = new TaxModel();
    return taxModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!taxModelInstance) taxModelInstance = new TaxModel();
    return taxModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!taxModelInstance) taxModelInstance = new TaxModel();
    return taxModelInstance.deleteOne(filter);
  },
};
