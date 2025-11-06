// Banner model for D1 database
import { getD1 } from "../config/d1.js";

const rowToBanner = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    identifier: row.identifier,
    subtitle: row.subtitle,
    image: row.image,
    mobileImage: row.mobileImage,
    type: row.type,
    position: row.position || 0,
    status: row.status === 1,
    actionType: row.actionType || "none",
    targetProduct: row.targetProductRecordId
      ? {
          recordId: row.targetProductRecordId,
          slug: row.targetProductSlug,
        }
      : null,
    targetCategory: row.targetCategoryRecordId
      ? {
          recordId: row.targetCategoryRecordId,
          identifier: row.targetCategoryIdentifier,
        }
      : null,
    customUrl: row.customUrl,
    startDate: row.startDate ? new Date(row.startDate * 1000) : new Date(),
    endDate: row.endDate ? new Date(row.endDate * 1000) : null,
    displayPriority: row.displayPriority || 1,
    textColor: row.textColor || "#ffffff",
    backgroundColor: row.backgroundColor || "transparent",
    buttonText: row.buttonText,
    buttonColor: row.buttonColor || "#007bff",
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    createdBy: row.createdBy,
    modifiedBy: row.modifiedBy,
    creationTime: row.creationTime
      ? new Date(row.creationTime * 1000)
      : new Date(),
    lastModified: row.lastModified
      ? new Date(row.lastModified * 1000)
      : new Date(),
  };
};

class BannerModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const banner = await this.db.findOne("banners", filter);
    return banner ? rowToBanner(banner) : null;
  }

  async find(filter = {}, options = {}) {
    const banners = await this.db.find("banners", filter, options);
    return banners.map(rowToBanner);
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const bannerData = {
      recordId: data.recordId,
      identifier: data.identifier,
      subtitle: data.subtitle || null,
      image: data.image,
      mobileImage: data.mobileImage || null,
      type: data.type,
      position: data.position || 0,
      status: data.status !== false ? 1 : 0,
      actionType: data.actionType || "none",
      targetProductRecordId: data.targetProduct?.recordId || null,
      targetProductSlug: data.targetProduct?.slug || null,
      targetCategoryRecordId: data.targetCategory?.recordId || null,
      targetCategoryIdentifier: data.targetCategory?.identifier || null,
      customUrl: data.customUrl || null,
      startDate: data.startDate
        ? Math.floor(new Date(data.startDate).getTime() / 1000)
        : now,
      endDate: data.endDate
        ? Math.floor(new Date(data.endDate).getTime() / 1000)
        : null,
      displayPriority: data.displayPriority || 1,
      textColor: data.textColor || "#ffffff",
      backgroundColor: data.backgroundColor || "transparent",
      buttonText: data.buttonText || null,
      buttonColor: data.buttonColor || "#007bff",
      clicks: data.clicks || 0,
      impressions: data.impressions || 0,
      createdBy: data.createdBy,
      modifiedBy: data.modifiedBy || null,
      creationTime: now,
      lastModified: now,
    };
    await this.db.insertOne("banners", bannerData);
    return this.findOne({ recordId: data.recordId });
  }

  async updateOne(filter, update) {
    const updateData = {
      ...update,
      lastModified: Math.floor(Date.now() / 1000),
    };
    if (update.targetProduct) {
      updateData.targetProductRecordId = update.targetProduct.recordId;
      updateData.targetProductSlug = update.targetProduct.slug;
      delete updateData.targetProduct;
    }
    if (update.targetCategory) {
      updateData.targetCategoryRecordId = update.targetCategory.recordId;
      updateData.targetCategoryIdentifier = update.targetCategory.identifier;
      delete updateData.targetCategory;
    }
    if (update.startDate) {
      updateData.startDate = Math.floor(
        new Date(update.startDate).getTime() / 1000
      );
    }
    if (update.endDate !== undefined) {
      updateData.endDate = update.endDate
        ? Math.floor(new Date(update.endDate).getTime() / 1000)
        : null;
    }
    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;
    await this.db.updateOne("banners", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("banners", filter);
    return true;
  }
}

let bannerModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!bannerModelInstance) bannerModelInstance = new BannerModel();
    return bannerModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!bannerModelInstance) bannerModelInstance = new BannerModel();
    return bannerModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!bannerModelInstance) bannerModelInstance = new BannerModel();
    return bannerModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!bannerModelInstance) bannerModelInstance = new BannerModel();
    return bannerModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!bannerModelInstance) bannerModelInstance = new BannerModel();
    return bannerModelInstance.deleteOne(filter);
  },
};
