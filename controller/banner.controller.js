// controllers/banner.controller.js
import Banner from "../models/banner.model.js";
import Product from "../models/addproduct.model.js";
import Category from "../models/category.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { uploadImage } from "../utils/uploadImage.js";

export const createBanner = async (req, res) => {
  try {
    const data = req.body;

    
    const [image, mobileImage] = await Promise.all([
      uploadImage(data.image),
      data.mobileImage ? uploadImage(data.mobileImage) : null
    ]);

    
    if (data.actionType === 'product' && data.targetProduct?.recordId) {
      const product = await Product.findOne({ recordId: data.targetProduct.recordId });
      if (!product) return errorResponse(res, "Target product not found", 400);
    }

    if (data.actionType === 'category' && data.targetCategory?.recordId) {
      const category = await Category.findOne({ recordId: data.targetCategory.recordId });
      if (!category) return errorResponse(res, "Target category not found", 400);
    }

    const banner = await Banner.create({
      ...data,
      recordId: generateRecordId(),
      image,
      mobileImage,
      createdBy: req.user?.email || "system"
    });

    return successResponse(res, "Banner created successfully", banner);
  } catch (error) {
    console.error("CreateBanner Error:", error);
    return errorResponse(res, "Failed to create banner", 500);
  }
};

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


    if (updates.image && !updates.image.startsWith('http')) {
      updates.image = await uploadImage(updates.image);
    }

    if (updates.mobileImage && !updates.mobileImage.startsWith('http')) {
      updates.mobileImage = await uploadImage(updates.mobileImage);
    }


    if (updates.actionType === 'product' && updates.targetProduct?.recordId) {
      const product = await Product.findOne({ recordId: updates.targetProduct.recordId });
      if (!product) return errorResponse(res, "Target product not found", 400);
    }

    if (updates.actionType === 'category' && updates.targetCategory?.recordId) {
      const category = await Category.findOne({ recordId: updates.targetCategory.recordId });
      if (!category) return errorResponse(res, "Target category not found", 400);
    }


    Object.keys(updates).forEach(key => {
      if (key !== 'recordId') {
        banner[key] = updates[key];
      }
    });

    banner.modifiedBy = req.user?.email || "system";
    await banner.save();

    return successResponse(res, "Banner updated successfully", banner);
  } catch (error) {
    console.error("UpdateBanner Error:", error);
    return errorResponse(res, "Failed to update banner", 500);
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { recordId } = req.body;
    
    if (!recordId) {
      return errorResponse(res, "recordId is required", 400);
    }

    const deleted = await Banner.findOneAndDelete({ recordId });
    if (!deleted) return errorResponse(res, "Banner not found", 404);

    return successResponse(res, "Banner deleted successfully", deleted);
  } catch (error) {
    console.error("DeleteBanner Error:", error);
    return errorResponse(res, "Failed to delete banner", 500);
  }
};

export const getBanners = async (req, res) => {
  try {
    const { type, status, limit = 10 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status !== undefined) query.status = status === 'true';
   
    query.status = true;
    query.$or = [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: new Date() } }
    ];
    query.startDate = { $lte: new Date() };

    const banners = await Banner.find(query)
      .sort({ displayPriority: 1, position: 1, creationTime: -1 })
      .limit(parseInt(limit));

    return successResponse(res, "Banners fetched successfully", banners);
  } catch (error) {
    console.error("GetBanners Error:", error);
    return errorResponse(res, "Failed to fetch banners", 500);
  }
};

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

export const recordBannerClick = async (req, res) => {
  try {
    const { recordId } = req.body;
    
    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const banner = await Banner.findOneAndUpdate(
      { recordId },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!banner) return errorResponse(res, "Banner not found", 404);

    return successResponse(res, "Click recorded successfully", banner);
  } catch (error) {
    console.error("RecordBannerClick Error:", error);
    return errorResponse(res, "Failed to record click", 500);
  }
};

export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ type: 1, position: 1, creationTime: -1 });

    return successResponse(res, "All banners fetched successfully", banners);
  } catch (error) {
    console.error("GetAllBanners Error:", error);
    return errorResponse(res, "Failed to fetch banners", 500);
  }
};