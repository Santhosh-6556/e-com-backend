import Category from "../models/category.model.js";
import { errorResponse, successResponse } from "../utils/response.js";

// Utility: generate recordId
const generateRecordId = () => Date.now().toString();

// ✅ Add Category
export const addCategory = async (req, res) => {
  try {
    const { identifier, name, shortDescription, image,displayPriority, parentCategory } = req.body;

    if (!identifier) {
      return errorResponse(res, "Identifier is required", 400);
    }

    // Check duplicate identifier
    const existing = await Category.findOne({ identifier });
    if (existing) {
      return errorResponse(res, "Identifier already exists", 400);
    }

    let parentData = null;

    // If parentCategory object with recordId is provided
    if (parentCategory?.recordId) {
      const parent = await Category.findOne({ recordId: parentCategory.recordId });
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

    const newCategory = await Category.create({
      recordId: generateRecordId(),
      identifier,
      name,
      shortDescription,
      image,
      displayPriority: displayPriority || 0,
      parentCategory: parentData,
      status: true,
      creationTime: Date.now(),
      lastModified: Date.now(),
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
      parentCategory, // can be object, null, or undefined
    } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required to edit category", 400);
    }

    // Find the category by recordId
    const category = await Category.findOne({ recordId });
    if (!category) {
      return errorResponse(res, "Category not found", 404);
    }

    // Handle parentCategory properly
    if (parentCategory === null) {
      category.parentCategory = null; // ✅ clear existing parent
    } else if (parentCategory?.recordId) {
      const parent = await Category.findOne({ recordId: parentCategory.recordId });
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
    // if parentCategory is undefined → don’t touch existing

    // Update other fields
    category.identifier = identifier ?? category.identifier;
    category.name = name ?? category.name;
    category.shortDescription = shortDescription ?? category.shortDescription;
    category.image = image ?? category.image;
    category.status = status ?? category.status;
    category.displayPriority = displayPriority ?? category.displayPriority;
    category.lastModified = Date.now();

    await category.save();

    return successResponse(res, "Category updated successfully", category);
  } catch (error) {
    console.error("Edit Category Error:", error);
    return errorResponse(res, "Failed to update category", 500);
  }
};



// ✅ Delete Category by recordId
export const deleteCategory = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const deleted = await Category.findOneAndDelete({ recordId });
    if (!deleted) return errorResponse(res, "Category not found", 404);

    return successResponse(res, "Category deleted successfully", deleted);
  } catch (err) {
    console.error("Delete Category Error:", err);
    return errorResponse(res, "Failed to delete category", 500);
  }
};

// ✅ Get All Categories (optionally filter by type)
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

// ✅ Get Category by recordId
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

    return successResponse(res, "Parent categories fetched successfully", categories);
  } catch (err) {
    console.error("Get Parent Categories Error:", err);
    return errorResponse(res, "Failed to fetch parent categories", 500);
  }
};


export const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Category.find({ parentCategory: { $ne: null } }).sort({
      displayPriority: 1,
      creationTime: -1,
    });

    return successResponse(res, "Subcategories fetched successfully", subcategories);
  } catch (err) {
    console.error("Get Subcategories Error:", err);
    return errorResponse(res, "Failed to fetch subcategories", 500);
  }
};


export const Categories = async (req, res) => {
  try {
    const category = await Category.find()
      .sort({ displayPriority: 1, creationTime: -1 });

    return successResponse(res, "All Category fetched successfully", category);
  } catch (error) {
    console.error("GetAllCategory Error:", error);
    return errorResponse(res, "Failed to fetch all nodes", 500);
  }
};