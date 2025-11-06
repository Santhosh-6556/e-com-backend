// FAQ model for D1 database
import { getD1 } from "../config/d1.js";

const rowToFAQ = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    identifier: row.identifier,
    question: row.question,
    answer: row.answer,
    status: row.status === 1,
    creationTime: row.creationTime
      ? new Date(row.creationTime * 1000)
      : new Date(),
    lastModified: row.lastModified
      ? new Date(row.lastModified * 1000)
      : new Date(),
  };
};

class FAQModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const faq = await this.db.findOne("faqs", filter);
    return faq ? rowToFAQ(faq) : null;
  }

  async find(filter = {}, options = {}) {
    const faqs = await this.db.find("faqs", filter, options);
    return faqs.map(rowToFAQ);
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const faqData = {
      recordId: data.recordId,
      identifier: data.identifier,
      question: data.question,
      answer: data.answer,
      status: data.status !== false ? 1 : 0,
      creationTime: now,
      lastModified: now,
    };
    await this.db.insertOne("faqs", faqData);
    return this.findOne({ recordId: data.recordId });
  }

  async updateOne(filter, update) {
    const updateData = {
      ...update,
      lastModified: Math.floor(Date.now() / 1000),
    };
    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;
    await this.db.updateOne("faqs", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("faqs", filter);
    return true;
  }
}

let faqModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!faqModelInstance) faqModelInstance = new FAQModel();
    return faqModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!faqModelInstance) faqModelInstance = new FAQModel();
    return faqModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!faqModelInstance) faqModelInstance = new FAQModel();
    return faqModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!faqModelInstance) faqModelInstance = new FAQModel();
    return faqModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!faqModelInstance) faqModelInstance = new FAQModel();
    return faqModelInstance.deleteOne(filter);
  },
};
