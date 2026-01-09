import Product from "../models/product.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { successResponse, errorResponse } from "../utils/response.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import { uploadImage } from "../utils/uploadImage.js";
import Tax from "../models/tax.model.js";

export const addProduct = async (req, res) => {
  try {
    const data = req.body;

    const images = await Promise.all(
      (data.images || []).map((img) => uploadImage(img, req.env))
    );
    const carouselImages = await Promise.all(
      (data.carouselImages || []).map((img) => uploadImage(img, req.env))
    );

    const productDescription = await Promise.all(
      (data.productDescription || []).map(async (desc) => ({
        text: desc.text,
        image: desc.image ? await uploadImage(desc.image, req.env) : null,
      }))
    );

    const product = await Product.create({
      ...data,
      recordId: generateRecordId(),
      images,
      carouselImages,
      productDescription,
      createdBy: req.user?.email || "system",
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

    const updateData = {};

    // ---------- Relations ----------
    if ("brand" in updates) {
      if (updates.brand === null) {
        updateData.brandRecordId = null;
        updateData.brandIdentifier = null;
      } else {
        const brand = await Brand.findOne({ recordId: updates.brand.recordId });
        if (!brand) return errorResponse(res, "Invalid brand recordId", 400);
        updateData.brandRecordId = brand.recordId;
        updateData.brandIdentifier = brand.identifier;
      }
    }

    if ("tax" in updates) {
      if (updates.tax === null) {
        updateData.taxRecordId = null;
        updateData.taxIdentifier = null;
      } else {
        const tax = await Tax.findOne({ recordId: updates.tax.recordId });
        if (!tax) return errorResponse(res, "Invalid tax recordId", 400);
        updateData.taxRecordId = tax.recordId;
        updateData.taxIdentifier = tax.identifier;
      }
    }

    if ("subcategory" in updates) {
      if (updates.subcategory === null) {
        updateData.subcategoryRecordId = null;
        updateData.subcategoryIdentifier = null;
      } else {
        const subCat = await Category.findOne({
          recordId: updates.subcategory.recordId,
        });
        if (!subCat)
          return errorResponse(res, "Invalid subcategory recordId", 400);
        updateData.subcategoryRecordId = subCat.recordId;
        updateData.subcategoryIdentifier = subCat.identifier;
      }
    }

    if ("category" in updates) {
      const category = await Category.findOne({
        recordId: updates.category.recordId,
      });
      if (!category)
        return errorResponse(res, "Invalid category recordId", 400);
      updateData.categoryRecordId = category.recordId;
      updateData.categoryIdentifier = category.identifier;
    }

    // ---------- Images ----------
    if ("images" in updates) {
      updateData.images = JSON.stringify(
        await Promise.all(
          (updates.images || []).map((img) =>
            img.startsWith("http") ? img : uploadImage(img, req.env)
          )
        )
      );
    }

    if ("carouselImages" in updates) {
      updateData.carouselImages = JSON.stringify(
        await Promise.all(
          (updates.carouselImages || []).map((img) =>
            img.startsWith("http") ? img : uploadImage(img, req.env)
          )
        )
      );
    }

    // ---------- Text fields ----------
    [
      "name",
      "price",
      "discountPrice",
      "stock",
      "status",
      "description",
      "identifier",
      "slug",
      "isTrending",
      "highlights",
      "attributes",
      "features",
    ].forEach((field) => {
      if (field in updates) {
        updateData[field] =
          typeof updates[field] === "object"
            ? JSON.stringify(updates[field])
            : updates[field];
      }
    });

    updateData.modifiedBy = req.user?.email || "system";
    updateData.lastModified = Math.floor(Date.now() / 1000);

    const updatedProduct = await Product.updateOne(
      { recordId },
      updateData
    );

    return successResponse(
      res,
      "Product updated successfully",
      updatedProduct
    );
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

    const product = await Product.findOne({ recordId });
    if (!product) return errorResponse(res, "Product not found", 404);
    await Product.deleteOne({ recordId });
    const deleted = product;
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
    const products = await Product.find({}, { sort: { creationTime: -1 } });

    return successResponse(res, "Products fetched successfully", products);
  } catch (error) {
    console.error("GetAllProducts Error:", error);
    return errorResponse(res, "Failed to fetch products", 500);
  }
};

export const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find();

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
    const {
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      minRating,
      status,
    } = req.body;

    const query = {};

    if (category?.recordId) {
      query.categoryRecordId = category.recordId;
    }

    if (subcategory?.recordId) {
      query.subcategoryRecordId = subcategory.recordId;
    }

    if (brand?.recordId) {
      query.brandRecordId = brand.recordId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined && maxPrice !== undefined) {
        query.price = { $gte: minPrice, $lte: maxPrice };
      } else if (minPrice !== undefined) {
        query.price = { $gte: minPrice };
      } else if (maxPrice !== undefined) {
        query.price = { $lte: maxPrice };
      }
    }

    if (minRating !== undefined) {
      query.ratingsAverage = { $gte: minRating };
    }

    if (status !== undefined) {
      query.status = status;
    }

    const products = await Product.find(query, { sort: { creationTime: -1 } });

    return successResponse(
      res,
      "Filtered products fetched successfully",
      products
    );
  } catch (error) {
    console.error("GetFilteredProducts Error:", error);
    return errorResponse(res, "Failed to fetch filtered products", 500);
  }
};

export const Products = async (req, res) => {
  try {
    const products = await Product.find(
      {},
      {
        sort: {
        
          creationTime: -1,
        },
      }
    );

    return successResponse(res, "All products fetched successfully", products);
  } catch (error) {
    console.error("GetAll Products Error:", error);
    return errorResponse(res, "Failed to fetch all Products", 500);
  }
};

export const getTrendingProducts = async (req, res) => {
  try {
    const trendingProducts = (await Product.find()).filter(
      (product) => product.isTrending === true
    );

    return successResponse(
      res,
      "Treanding Products fetched successfully",
      trendingProducts
    );
  } catch (error) {
    console.error("Trending products error", error);
    return errorResponse(res, "Failed to fetch treanding products");
  }
};
