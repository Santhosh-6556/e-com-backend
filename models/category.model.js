import { getD1 } from "../config/d1.js";

const rowToCategory = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    identifier: row.identifier,
    name: row.name,
    shortDescription: row.shortDescription,
    image: row.image,
    parentCategory: row.parentCategoryRecordId
      ? {
          recordId: row.parentCategoryRecordId,
          identifier: row.parentCategoryIdentifier,
          name: row.parentCategoryName,
          shortDescription: row.parentCategoryShortDescription,
          image: row.parentCategoryImage,
        }
      : null,
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

class CategoryModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const category = await this.db.findOne("categories", filter);
    return category ? rowToCategory(category) : null;
  }

  async find(filter = {}, options = {}) {
    const categories = await this.db.find("categories", filter, options);
    return categories.map(rowToCategory);
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const categoryData = {
      recordId: data.recordId,
      identifier: data.identifier,
      name: data.name || null,
      shortDescription: data.shortDescription || null,
      image: data.image || null,
      parentCategoryRecordId: data.parentCategory?.recordId || null,
      parentCategoryIdentifier: data.parentCategory?.identifier || null,
      parentCategoryName: data.parentCategory?.name || null,
      parentCategoryShortDescription:
        data.parentCategory?.shortDescription || null,
      parentCategoryImage: data.parentCategory?.image || null,
      displayPriority: data.displayPriority || 0,
      status: data.status !== false ? 1 : 0,
      creator: data.creator || null,
      creationTime: now,
      lastModified: now,
    };
    await this.db.insertOne("categories", categoryData);
    return this.findOne({ recordId: data.recordId });
  }

  async updateOne(filter, update) {
    const updateData = {
      ...update,
      lastModified: Math.floor(Date.now() / 1000),
    };
    if (update.parentCategory) {
      updateData.parentCategoryRecordId = update.parentCategory.recordId;
      updateData.parentCategoryIdentifier = update.parentCategory.identifier;
      updateData.parentCategoryName = update.parentCategory.name;
      updateData.parentCategoryShortDescription =
        update.parentCategory.shortDescription;
      updateData.parentCategoryImage = update.parentCategory.image;
      delete updateData.parentCategory;
    }
    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;
    await this.db.updateOne("categories", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("categories", filter);
    return true;
  }
}

let categoryModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!categoryModelInstance) categoryModelInstance = new CategoryModel();
    return categoryModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!categoryModelInstance) categoryModelInstance = new CategoryModel();
    return categoryModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!categoryModelInstance) categoryModelInstance = new CategoryModel();
    return categoryModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!categoryModelInstance) categoryModelInstance = new CategoryModel();
    return categoryModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!categoryModelInstance) categoryModelInstance = new CategoryModel();
    return categoryModelInstance.deleteOne(filter);
  },
};
