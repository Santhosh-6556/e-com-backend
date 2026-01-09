// controllers/banner.controller.js
import Banner from "../models/banner.model.js";
import Product from "../models/addproduct.model.js";
import Category from "../models/category.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { uploadImage } from "../utils/uploadImage.js";

/* ---------------- CREATE ---------------- */
export const createBanner = async (req, res) => {
  try {
    const data = req.body;

    const image = data.image
      ? await uploadImage(data.image, req.env)
      : null;

    const mobileImage = data.mobileImage
      ? await uploadImage(data.mobileImage, req.env)
      : null;

    if (data.actionType === "product" && data.targetProductRecordId) {
      const product = await Product.findOne({
        recordId: data.targetProductRecordId,
      });
      if (!product) return errorResponse(res, "Target product not found", 400);
    }

    if (data.actionType === "category" && data.targetCategoryRecordId) {
      const category = await Category.findOne({
        recordId: data.targetCategoryRecordId,
      });
      if (!category)
        return errorResponse(res, "Target category not found", 400);
    }

    const banner = await Banner.create({
      ...data,
      recordId: generateRecordId(),
      image,
      mobileImage,
      status: data.status ?? 1,
      clicks: 0,
      impressions: 0,
      createdBy: req.user?.email || "system",
    });

    return successResponse(res, "Banner created successfully", banner);
  } catch (error) {
    console.error("CreateBanner Error:", error);
    return errorResponse(res, "Failed to create banner", 500);
  }
};

/* ---------------- UPDATE ---------------- */
export const updateBanner = async (req, res) => {
  try {
    const { recordId, ...updates } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required", 400);
    }

    const banner = await Banner.findOne({ recordId });
    if (!banner) {
      return errorResponse(res, "Banner not found", 404);
    }

    const updateData = {};

    if (updates.image) {
      updateData.image = updates.image.startsWith("http")
        ? updates.image
        : await uploadImage(updates.image, req.env);
    }

    if (updates.mobileImage) {
      updateData.mobileImage = updates.mobileImage.startsWith("http")
        ? updates.mobileImage
        : await uploadImage(updates.mobileImage, req.env);
    }

    if (updates.actionType === "product" && updates.targetProductRecordId) {
      const product = await Product.findOne({
        recordId: updates.targetProductRecordId,
      });
      if (!product) return errorResponse(res, "Target product not found", 400);
    }

    if (updates.actionType === "category" && updates.targetCategoryRecordId) {
      const category = await Category.findOne({
        recordId: updates.targetCategoryRecordId,
      });
      if (!category)
        return errorResponse(res, "Target category not found", 400);
    }

    [
      "identifier",
      "subtitle",
      "type",
      "position",
      "status",
      "actionType",
      "targetProductRecordId",
      "targetProductSlug",
      "targetCategoryRecordId",
      "targetCategoryIdentifier",
      "customUrl",
      "startDate",
      "endDate",
      "displayPriority",
      "textColor",
      "backgroundColor",
      "buttonText",
      "buttonColor",
    ].forEach((field) => {
      if (field in updates) {
        updateData[field] = updates[field];
      }
    });

    updateData.modifiedBy = req.user?.email || "system";
    updateData.lastModified = Math.floor(Date.now() / 1000);

    const updatedBanner = await Banner.updateOne(
      { recordId },
      updateData
    );

    return successResponse(res, "Banner updated successfully", updatedBanner);
  } catch (error) {
    console.error("UpdateBanner Error:", error);
    return errorResponse(res, "Failed to update banner", 500);
  }
};

/* ---------------- DELETE ---------------- */
export const deleteBanner = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required", 400);
    }

    const banner = await Banner.findOne({ recordId });
    if (!banner) return errorResponse(res, "Banner not found", 404);

    await Banner.deleteOne({ recordId });

    return successResponse(res, "Banner deleted successfully", banner);
  } catch (error) {
    console.error("DeleteBanner Error:", error);
    return errorResponse(res, "Failed to delete banner", 500);
  }
};

/* ---------------- GET ACTIVE BANNERS ---------------- */
export const getBanners = async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;

    let banners = await Banner.find();

    if (!Array.isArray(banners)) banners = [];

    const now = Date.now(); // milliseconds

    banners = banners.filter((b) => {
      // ✅ status is BOOLEAN
      if (b.status !== true) return false;

      // type filter
      if (type && b.type !== type) return false;

      // ✅ startDate is Date
      if (b.startDate && b.startDate.getTime() > now) return false;

      // ✅ endDate is Date
      if (b.endDate && b.endDate.getTime() < now) return false;

      return true;
    });

    banners.sort((a, b) => {
      if ((a.displayPriority ?? 1) !== (b.displayPriority ?? 1)) {
        return (a.displayPriority ?? 1) - (b.displayPriority ?? 1);
      }

      if ((a.position ?? 0) !== (b.position ?? 0)) {
        return (a.position ?? 0) - (b.position ?? 0);
      }

      return (
        (b.creationTime?.getTime?.() || 0) -
        (a.creationTime?.getTime?.() || 0)
      );
    });

    return successResponse(
      res,
      "Banners fetched successfully",
      banners.slice(0, Number(limit))
    );
  } catch (error) {
    console.error("GetBanners Error:", error);
    return errorResponse(res, "Failed to fetch banners", 500);
  }
};



/* ---------------- GET BY RECORD ID ---------------- */
export const getBannerByRecordId = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const banner = await Banner.findOne({ recordId });
    if (!banner) return errorResponse(res, "Banner not found", 404);

    return successResponse(res, "Banner fetched successfully", banner);
  } catch (error) {
    console.error("GetBanner Error:", error);
    return errorResponse(res, "Failed to fetch banner", 500);
  }
};

/* ---------------- CLICK TRACKING ---------------- */
export const recordBannerClick = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const banner = await Banner.findOne({ recordId });
    if (!banner) return errorResponse(res, "Banner not found", 404);

    const updatedBanner = await Banner.updateOne(
      { recordId },
      { clicks: (banner.clicks || 0) + 1 }
    );

    return successResponse(res, "Click recorded successfully", updatedBanner);
  } catch (error) {
    console.error("RecordBannerClick Error:", error);
    return errorResponse(res, "Failed to record click", 500);
  }
};

/* ---------------- ADMIN: ALL BANNERS ---------------- */
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();

    banners.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if (a.position !== b.position) return a.position - b.position;
      return b.creationTime - a.creationTime;
    });

    return successResponse(res, "All banners fetched successfully", banners);
  } catch (error) {
    console.error("GetAllBanners Error:", error);
    return errorResponse(res, "Failed to fetch banners", 500);
  }
};
