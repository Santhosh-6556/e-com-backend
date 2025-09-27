
import Product from "../models/addproduct.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import { uploadImage } from "../utils/uploadImage.js";

export const addProduct = async (req, res) => {
  try {
    const data = req.body;

    const images = await Promise.all((data.images || []).map(uploadImage));
    const carouselImages = await Promise.all((data.carouselImages || []).map(uploadImage));

    const productDescription = await Promise.all(
      (data.productDescription || []).map(async (desc) => ({
        text: desc.text,
        image: desc.image ? await uploadImage(desc.image) : null,
      }))
    );

    const product = await Product.create({
      ...data,
      recordId: generateRecordId(),
      images,
      carouselImages,
      productDescription,
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
        if (!brand) return errorResponse(res, "Invalid brand recordId", 400);
        product.brand = { recordId: brand.recordId, identifier: brand.identifier };
      }
    }


    if ("subcategory" in updates) {
      if (updates.subcategory === null) {
        product.subcategory = null;
      } else if (updates.subcategory?.recordId) {
        const subCat = await Category.findOne({ recordId: updates.subcategory.recordId });
        if (!subCat) return errorResponse(res, "Invalid subcategory recordId", 400);
        product.subcategory = { recordId: subCat.recordId, identifier: subCat.identifier };
      }
    }


    if ("category" in updates) {
      if (updates.category === null) {
        product.category = null;
      } else if (updates.category?.recordId) {
        const category = await Category.findOne({ recordId: updates.category.recordId });
        if (!category) return errorResponse(res, "Invalid category recordId", 400);
        product.category = { recordId: category.recordId, identifier: category.identifier };
      }
    }

    
    if ("ratings" in updates) {
      product.ratings = updates.ratings ?? { average: 0, count: 0 };
    }


    if ("reviews" in updates) {
      product.reviews = Array.isArray(updates.reviews) ? updates.reviews : [];
    }

 
    if ("images" in updates) {
      product.images = await Promise.all(
        (updates.images || []).map(async (img) =>
          img.startsWith("http") ? img : await uploadImage(img)
        )
      );
    }

    if ("carouselImages" in updates) {
      product.carouselImages = await Promise.all(
        (updates.carouselImages || []).map(async (img) =>
          img.startsWith("http") ? img : await uploadImage(img)
        )
      );
    }

   
    if ("productDescription" in updates) {
      product.productDescription = await Promise.all(
        (updates.productDescription || []).map(async (desc) => ({
          text: desc.text,
          image: desc.image
            ? (desc.image.startsWith("http") ? desc.image : await uploadImage(desc.image))
            : null,
        }))
      );
    }

  
    ["highlights", "attributes", "Features"].forEach((field) => {
      if (field in updates) {
        product[field] = updates[field] || [];
      }
    });

  
    ["name", "price", "discountPrice", "stock", "status", "description", "identifier","slug","isTrending"].forEach(
      (field) => {
        if (field in updates) {
          product[field] = updates[field];
        }
      }
    );

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


export const getProductByRecordId = async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) return errorResponse(res, "recordId is required", 400);

    const product = await Product.findOne({ recordId });
    if (!product) return errorResponse(res, "Product not found", 404);

    return successResponse(res, "Product fetched successfully", product);
  } catch (err) {
    console.error("Get product Error:", err);
    return errorResponse(res, "Failed to fetch Product", 500);
  }
};

export const getProductByslug = async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return errorResponse(res, "recordId is required", 400);

    const product = await Product.findOne({ slug });
    if (!product) return errorResponse(res, "Product not found", 404);

    return successResponse(res, "Product fetched successfully", product);
  } catch (err) {
    console.error("Get product Error:", err);
    return errorResponse(res, "Failed to fetch Product", 500);
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


export const Products = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ displayPriority: 1, creationTime: -1 });

    return successResponse(res, "All products fetched successfully", products);
  } catch (error) {
    console.error("GetAll Products Error:", error);
    return errorResponse(res, "Failed to fetch all nodes", 500);
  }
};
