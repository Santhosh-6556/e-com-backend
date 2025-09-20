
import Product from "../models/addproduct.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";

export const addProduct = async (req, res) => {
  try {
    const data = req.body;

    // ✅ Handle brand (optional)
    let brandData = null;
    if (data.brand?.recordId) {
      const brand = await Brand.findOne({ recordId: data.brand.recordId });
      if (!brand) {
        return errorResponse(res, "Invalid brand recordId", 400);
      }
      brandData = { recordId: brand.recordId, identifier: brand.identifier };
    }

    // ✅ Handle subcategory (optional)
    let subcategoryData = null;
    if (data.subcategory?.recordId) {
      const subCat = await Category.findOne({ recordId: data.subcategory.recordId });
      if (!subCat) {
        return errorResponse(res, "Invalid subcategory recordId", 400);
      }
      subcategoryData = { recordId: subCat.recordId, identifier: subCat.identifier };
    }


     let categoryData = null;
    if (data.category?.recordId) {
      const category = await Category.findOne({ recordId: data.category.recordId });
      if (!category) {
        return errorResponse(res, "Invalid subcategory recordId", 400);
      }
      categoryData = { recordId: category.recordId, identifier: category.identifier };
    }

    const product = await Product.create({
      ...data,
      recordId: generateRecordId(),
      brand: brandData,             // optional
      subcategory: subcategoryData, // optional
      category: categoryData, // optional
      createdBy: req.user?.email || "system"
    });

    return successResponse(res, "Product created successfully", product);
  } catch (error) {
    console.error("AddProduct Error:", error);
    return errorResponse(res, "Failed to add product", 500);
  }
};


export const editProduct = async (req, res) => {
  try {
    const { recordId, ...updates } = req.body;
    if (!recordId) {
      return errorResponse(res, "recordId is required", 400);
    }

    const product = await Product.findOne({ recordId });
    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }


    if ("brand" in updates) {
      if (updates.brand === null) {
        product.brand = null;
      } else if (updates.brand?.recordId) {
        const brand = await Brand.findOne({ recordId: updates.brand.recordId });
        if (!brand) {
          return errorResponse(res, "Invalid brand recordId", 400);
        }
        product.brand = {
          recordId: brand.recordId,
          identifier: brand.identifier,
        };
      } else {
        product.brand = null;
      }
    } else {
      product.brand = null; 
    }

   
    if ("subcategory" in updates) {
      if (updates.subcategory === null) {
        product.subcategory = null;
      } else if (updates.subcategory?.recordId) {
        const subCat = await Category.findOne({ recordId: updates.subcategory.recordId });
        if (!subCat) {
          return errorResponse(res, "Invalid subcategory recordId", 400);
        }
        product.subcategory = {
          recordId: subCat.recordId,
          identifier: subCat.identifier,
        };
      } else {
        product.subcategory = null;
      }
    } else {
      product.subcategory = null;
    }

     if ("category" in updates) {
      if (updates.category === null) {
        product.category = null;
      } else if (updates.category?.recordId) {
        const category = await Category.findOne({ recordId: updates.category.recordId });
        if (!category) {
          return errorResponse(res, "Invalid subcategory recordId", 400);
        }
        product.category = {
          recordId: category.recordId,
          identifier: category.identifier,
        };
      } else {
        product.category = null;
      }
    } else {
      product.category = null;
    }
    // ✅ Ratings
    if ("ratings" in updates) {
      if (updates.ratings === null) {
        product.ratings = { average: 0, count: 0 };
      } else {
        product.ratings = updates.ratings;
      }
    } else {
      product.ratings = { average: 0, count: 0 };
    }

    // ✅ Reviews
    if ("reviews" in updates) {
      if (updates.reviews === null) {
        product.reviews = [];
      } else if (Array.isArray(updates.reviews)) {
        product.reviews = updates.reviews;
      }
    } else {
      product.reviews = [];
    }

    const arrayFields = [
      "images",
      "carouselImages",
      "highlights",
      "productDescription",
      "attributes",
    ];

    arrayFields.forEach((field) => {
      if (field in updates) {
        if (updates[field] === null) {
          product[field] = [];
        } else {
          product[field] = updates[field];
        }
      } else {
        product[field] = [];
      }
    });

    // ✅ Scalars
    const scalarFields = [
      "name",
      "price",
      "discountPrice",
      "stock",
      "status",
      "description",
      "identifier"
    ];

    scalarFields.forEach((field) => {
      if (field in updates) {
        product[field] = updates[field];
      }
    });


    product.modifiedBy = req.user?.email || "system";
    product.lastModified = Date.now();

    await product.save();

    return successResponse(res, "Product updated successfully", product);
  } catch (error) {
    console.error("EditProduct Error:", error);
    return errorResponse(res, "Failed to update product", 500);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) {
      return errorResponse(res, "recordId is required", 400);
    }

    const deleted = await Product.findOneAndDelete({ recordId });
    if (!deleted) return errorResponse(res, "Product not found", 404);

    return successResponse(res, "Product deleted successfully", deleted);
  } catch (error) {
    console.error("DeleteProduct Error:", error);
    return errorResponse(res, "Failed to delete product", 500);
  }
};

// ✅ View All Products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ creationTime: -1 });

    return successResponse(res, "Products fetched successfully", products);
  } catch (error) {
    console.error("GetAllProducts Error:", error);
    return errorResponse(res, "Failed to fetch products", 500);
  }
};

// ✅ View Particular Product by recordId
export const getProductByRecordId = async (req, res) => {
  try {
    const { recordId } = req.params;

    const product = await Product.findOne({ recordId });
    if (!product) return errorResponse(res, "Product not found", 404);

    return successResponse(res, "Product fetched successfully", product);
  } catch (error) {
    console.error("GetProduct Error:", error);
    return errorResponse(res, "Failed to fetch product", 500);
  }
};



export const getFilteredProducts = async (req, res) => {
  try {
    const { category, subcategory, brand, minPrice, maxPrice, minRating, status } = req.body;

    const query = {};


    if (category?.recordId) {
      query["category.recordId"] = category.recordId;
    }

    if (subcategory?.recordId) {
      query["subcategory.recordId"] = subcategory.recordId;
    }

   
    if (brand?.recordId) {
      query["brand.recordId"] = brand.recordId;
    }

 
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

   
    if (minRating !== undefined) {
      query["ratings.average"] = { $gte: minRating };
    }


    if (status !== undefined) {
      query.status = status;
    }


    const products = await Product.find(query).sort({ creationTime: -1 });

    return successResponse(res, "Filtered products fetched successfully", products);
  } catch (error) {
    console.error("GetFilteredProducts Error:", error);
    return errorResponse(res, "Failed to fetch filtered products", 500);
  }
};

