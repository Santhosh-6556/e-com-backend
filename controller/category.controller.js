import Category from "../models/category.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { uploadImage } from "../utils/uploadImage.js";

export const addCategory = async (req, res) => {
  try {
    const {
      identifier,
      name,
      shortDescription,
      image,
      displayPriority,
      parentCategory,
    } = req.body;

    if (!identifier) {
      return errorResponse(res, "Identifier is required", 400);
    }

    const existing = await Category.findOne({ identifier });
    if (existing) {
      return errorResponse(res, "Identifier already exists", 400);
    }

    let parentData = null;
    if (parentCategory?.recordId) {
      const parent = await Category.findOne({
        recordId: parentCategory.recordId,
      });
      if (!parent) {
        return errorResponse(res, "Parent category not found", 404);
      }

      parentData = {
        recordId: parent.recordId,
        identifier: parent.identifier,
        name: parent.name,
        shortDescription: parent.shortDescription,
        image: parent.image,
      };
    }

    const uploadedImage = image
      ? image.startsWith("http")
        ? image
        : await uploadImage(image, req.env)
      : null;

    const newCategory = await Category.create({
      recordId: generateRecordId(),
      identifier,
      name,
      shortDescription,
      image: uploadedImage,
      displayPriority: displayPriority || 0,
      parentCategory: parentData,
      status: true,
      creationTime: Date.now(),
      lastModified: Date.now(),
      createdBy: req.user?.email || "system",
    });

    return successResponse(res, "Category created successfully", newCategory);
  } catch (error) {
    console.error("Add Category Error:", error);
    return errorResponse(res, "Failed to create category", 500);
  }
};

export const editCategory = async (req, res) => {
  try {
    const {
      recordId,
      identifier,
      name,
      shortDescription,
      image,
      status,
      displayPriority,
      parentCategory,
    } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required to edit category", 400);
    }

    const category = await Category.findOne({ recordId });
    if (!category) {
      return errorResponse(res, "Category not found", 404);
    }

    if (parentCategory === null) {
      category.parentCategory = null;
    } else if (parentCategory?.recordId) {
      const parent = await Category.findOne({
        recordId: parentCategory.recordId,
      });
      if (!parent) {
        return errorResponse(res, "Parent category not found", 404);
      }

      category.parentCategory = {
        recordId: parent.recordId,
        identifier: parent.identifier,
        name: parent.name,
        shortDescription: parent.shortDescription,
        image: parent.image,
      };
    }

    if (typeof image === "string") {
      category.image = image.startsWith("http")
        ? image
        : await uploadImage(image, req.env);
    }

    if (identifier !== undefined) category.identifier = identifier;
    if (name !== undefined) category.name = name;
    if (shortDescription !== undefined)
      category.shortDescription = shortDescription;
    if (status !== undefined) category.status = status;
    if (displayPriority !== undefined)
      category.displayPriority = displayPriority;

    category.lastModified = Date.now();
    const updatedCategory = await Category.updateOne(
      { recordId: categoryId },
      {
        ...updates,
        modifiedBy: req.user?.email || "system",
        lastModified: Math.floor(Date.now() / 1000),
      }
    );

    return successResponse(
      res,
      "Category updated successfully",
      updatedCategory
    );
  } catch (error) {
    console.error("Edit Category Error:", error);
    return errorResponse(res, "Failed to update category", 500);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const category = await Category.findOne({ recordId });
    if (!category) return errorResponse(res, "Category not found", 404);
    await Category.deleteOne({ recordId });
    const deleted = category;
    if (!deleted) return errorResponse(res, "Category not found", 404);

    return successResponse(res, "Category deleted successfully", deleted);
  } catch (err) {
    console.error("Delete Category Error:", err);
    return errorResponse(res, "Failed to delete category", 500);
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const categories = await Category.find(filter).sort({
      displayPriority: 1,
      creationTime: -1,
    });

    return successResponse(res, "Categories fetched successfully", categories);
  } catch (err) {
    console.error("Get All Categories Error:", err);
    return errorResponse(res, "Failed to fetch categories", 500);
  }
};

export const getCategoryByRecordId = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const category = await Category.findOne({ recordId });
    if (!category) return errorResponse(res, "Category not found", 404);

    return successResponse(res, "Category fetched successfully", category);
  } catch (err) {
    console.error("Get Category Error:", err);
    return errorResponse(res, "Failed to fetch category", 500);
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ parentCategory: null }).sort({
      displayPriority: 1,
      creationTime: -1,
    });

    return successResponse(
      res,
      "Parent categories fetched successfully",
      categories
    );
  } catch (err) {
    console.error("Get Parent Categories Error:", err);
    return errorResponse(res, "Failed to fetch parent categories", 500);
  }
};

export const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Category.find({
      parentCategory: { $ne: null },
    }).sort({
      displayPriority: 1,
      creationTime: -1,
    });

    return successResponse(
      res,
      "Subcategories fetched successfully",
      subcategories
    );
  } catch (err) {
    console.error("Get Subcategories Error:", err);
    return errorResponse(res, "Failed to fetch subcategories", 500);
  }
};

export const Categories = async (req, res) => {
  try {
    const category = await Category.find().sort({
      displayPriority: 1,
      creationTime: -1,
    });

    return successResponse(res, "All Category fetched successfully", category);
  } catch (error) {
    console.error("GetAllCategory Error:", error);
    return errorResponse(res, "Failed to fetch all nodes", 500);
  }
};

export const getCategory = async (req, res) => {
  try {
    const category = await Category.find().sort({
      displayPriority: 1,
      creationTime: -1,
    });

    return successResponse(res, "All Category fetched successfully", category);
  } catch (error) {
    console.error("GetAllCategory Error:", error);
    return errorResponse(res, "Failed to fetch all nodes", 500);
  }
};

export const getAdminCategories = async (req, res) => {
  try {
    const category = await Category.find().sort({
      displayPriority: 1,
      creationTime: -1,
    });

    return successResponse(res, "All Category fetched successfully", category);
  } catch (error) {
    console.error("GetAllCategory Error:", error);
    return errorResponse(res, "Failed to fetch all nodes", 500);
  }
};

export const getAdminSubcategories = async (req, res) => {
  try {
    const subcategories = await Category.find({
      parentCategory: { $ne: null },
    }).sort({
      displayPriority: 1,
      creationTime: -1,
    });

    return successResponse(
      res,
      "Subcategories fetched successfully",
      subcategories
    );
  } catch (err) {
    console.error("Get Subcategories Error:", err);
    return errorResponse(res, "Failed to fetch subcategories", 500);
  }
};
