// Tax model for D1 database
import { getD1 } from "../config/d1.js";

/* ---------- Utility Functions ---------- */
const nowInSeconds = () => Math.floor(Date.now() / 1000);

/* ---------- Tax Row Mapper ---------- */
const rowToTax = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    identifier: row.identifier,
    rate: row.rate,
    status: row.status === 1,
    creationTime: row.creationTime ? new Date(row.creationTime * 1000) : null,
    lastModified: row.lastModified ? new Date(row.lastModified * 1000) : null,
  };
};

/* ---------- Tax Model ---------- */
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
    const timestamp = nowInSeconds();

    const taxData = {
      recordId: data.recordId,
      identifier: data.identifier,
      rate: data.rate || null,
      status: data.status !== false ? 1 : 0,
      creationTime: timestamp,
      lastModified: timestamp,
    };

    await this.db.insertOne("taxes", taxData);
    return this.findOne({ recordId: data.recordId });
  }

  async updateOne(filter, update) {
    const updateData = { ...update, lastModified: nowInSeconds() };
    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;

    await this.db.updateOne("taxes", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("taxes", filter);
    return true;
  }
}

/* ---------- Singleton Export ---------- */
let taxModelInstance = null;

export default {
  findOne: (filter) => (taxModelInstance ??= new TaxModel()).findOne(filter),
  find: (filter, options) => (taxModelInstance ??= new TaxModel()).find(filter, options),
  create: (data) => (taxModelInstance ??= new TaxModel()).create(data),
  updateOne: (filter, update) => (taxModelInstance ??= new TaxModel()).updateOne(filter, update),
  deleteOne: (filter) => (taxModelInstance ??= new TaxModel()).deleteOne(filter),
};
