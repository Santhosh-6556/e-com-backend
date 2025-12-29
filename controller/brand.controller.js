import Brand from "../models/brand.model.js";
import { errorResponse, successResponse } from "../utils/response.js";

// Utility: generate recordId
const generateRecordId = () => Date.now().toString();

// ✅ Add Brand
export const addBrand = async (req, res) => {
  try {
    const { identifier, name, shortDescription, image, displayPriority } =
      req.body;

    if (!identifier) {
      return errorResponse(res, "Identifier is required", 400);
    }

    // Check duplicate identifier
    const existing = await Brand.findOne({ identifier });
    if (existing) {
      return errorResponse(res, "Identifier already exists", 400);
    }

    const newBrand = await Brand.create({
      recordId: generateRecordId(),
      identifier,
      name,
      shortDescription,
      image,
      displayPriority: displayPriority || 0,
      status: true,
      creationTime: Date.now(),
      lastModified: Date.now(),
    });

    return successResponse(res, "Brand created successfully", newBrand);
  } catch (error) {
    console.error("Add Brand Error:", error);
    return errorResponse(res, "Failed to create Brand", 500);
  }
};

export const editBrand = async (req, res) => {
  try {
    const {
      recordId,
      identifier,
      name,
      shortDescription,
      image,
      status,
      displayPriority,
    } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required to edit Brand", 400);
    }

    // Find the Brand by recordId
    const brand = await Brand.findOne({ recordId });
    if (!brand) {
      return errorResponse(res, "Brand not found", 404);
    }

    const updatedBrand = await Brand.updateOne(
      { recordId: brandId },
      {
        identifier: identifier ?? brand.identifier,
        name: name ?? brand.name,
        shortDescription: shortDescription ?? brand.shortDescription,
        image: image ?? brand.image,
        status: status ?? brand.status,
        displayPriority: displayPriority ?? brand.displayPriority,
        lastModified: Math.floor(Date.now() / 1000),
      }
    );

    return successResponse(res, "Brand updated successfully", updatedBrand);
  } catch (error) {
    console.error("Edit Brand Error:", error);
    return errorResponse(res, "Failed to update Brand", 500);
  }
};

// ✅ Delete Brand by recordId
export const deleteBrand = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const brand = await Brand.findOne({ recordId });
    if (!brand) return errorResponse(res, "Brand not found", 404);
    await Brand.deleteOne({ recordId });
    const deleted = brand;
    if (!deleted) return errorResponse(res, "Brand not found", 404);

    return successResponse(res, "Brand deleted successfully", deleted);
  } catch (err) {
    console.error("Delete Brand Error:", err);
    return errorResponse(res, "Failed to delete Brand", 500);
  }
};

// ✅ Get All Categories (optionally filter by type)
export const getAllBrand = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const brand = await Brand.find(filter, {
      sort: {
        displayPriority: 1,
        creationTime: -1,
      },
    });

    return successResponse(res, "Categories fetched successfully", brand);
  } catch (err) {
    console.error("Get All Categories Error:", err);
    return errorResponse(res, "Failed to fetch categories", 500);
  }
};

// ✅ Get Brand by recordId
export const getBrandByRecordId = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const brand = await Brand.findOne({ recordId });
    if (!brand) return errorResponse(res, "Brand not found", 404);

    return successResponse(res, "Brand fetched successfully", brand);
  } catch (err) {
    console.error("Get Brand Error:", err);
    return errorResponse(res, "Failed to fetch Brand", 500);
  }
};

export const Brands = async (req, res) => {
  try {
    const brand = await Brand.find(
      {},
      {
        sort: {
          displayPriority: 1,
          creationTime: -1,
        },
      }
    );

    return successResponse(res, "All Category fetched successfully", brand);
  } catch (error) {
    console.error("GetAllCategory Error:", error);
    return errorResponse(res, "Failed to fetch all nodes", 500);
  }
};
