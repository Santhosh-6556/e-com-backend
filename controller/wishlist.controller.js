import Wishlist from "../models/wishlist.model.js";
import Product from "../models/addproduct.model.js";

import { errorResponse, successResponse } from "../utils/response.js";

export const addToWishlist = async (req, res) => {
  try {
    const { productId, userId } = req.body;
    const userRecordIdFromToken = req.user.recordId;

    if (userId !== userRecordIdFromToken) {
      return errorResponse(res, "Unauthorized access", 403);
    }

    if (!productId || !userId) {
      return errorResponse(res, "User ID and Product ID are required", 400);
    }

    const product = await Product.findOne({ recordId: productId });
    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }

    let wishlist = await Wishlist.findOne({ userRecordId: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userRecordId: userId,
      });
    }

    const existingItem = wishlist.items.find(
      (item) => item.productRecordId === productId
    );

    if (existingItem) {
      return errorResponse(res, "Product already in wishlist", 400);
    }

    await Wishlist.addItem(userId, productId);
    wishlist = await Wishlist.findOne({ userRecordId: userId });

    return successResponse(res, "Product added to wishlist", {
      wishlist: {
        id: wishlist.id,
        itemCount: wishlist.itemCount,
        userId: wishlist.userRecordId,
        items: wishlist.items.map((item) => ({
          id: item.id,
          productRecordId: item.productRecordId,
          addedAt: item.addedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Add to Wishlist Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId, userId } = req.body;
    const userRecordIdFromToken = req.user.recordId;

    if (userId !== userRecordIdFromToken) {
      return errorResponse(res, "Unauthorized access", 403);
    }

    if (!productId || !userId) {
      return errorResponse(res, "User ID and Product ID are required", 400);
    }

    const wishlist = await Wishlist.findOne({ userRecordId: userId });

    if (!wishlist) {
      return errorResponse(res, "Wishlist not found", 404);
    }

    const existingItem = wishlist.items.find(
      (item) => item.productRecordId === productId
    );

    if (!existingItem) {
      return errorResponse(res, "Product not found in wishlist", 404);
    }

    await Wishlist.removeItem(userId, productId);
    wishlist = await Wishlist.findOne({ userRecordId: userId });

    return successResponse(res, "Product removed from wishlist", {
      wishlist: {
        id: wishlist.id,
        itemCount: wishlist.itemCount,
        userId: wishlist.userRecordId,
        items: wishlist.items.map((item) => ({
          id: item.id,
          productRecordId: item.productRecordId,
          addedAt: item.addedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Remove from Wishlist Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const getWishlist = async (req, res) => {
  try {
    const { userId } = req.body;
    const userRecordIdFromToken = req.user.recordId;

    if (userId !== userRecordIdFromToken) {
      return errorResponse(res, "Unauthorized access", 403);
    }

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const wishlist = await Wishlist.findOne({ userRecordId: userId });

    if (!wishlist) {
      return successResponse(res, "Wishlist is empty", {
        wishlist: {
          id: null,
          itemCount: 0,
          items: [],
        },
      });
    }

    const productRecordIds = wishlist.items.map((item) => item.productRecordId);
    const products = await Product.find({
      recordId: productRecordIds,
    });

    const productMap = {};
    products.forEach((product) => {
      productMap[product.recordId] = product;
    });

    const itemsWithProducts = wishlist.items.map((item) => {
      const product = productMap[item.productRecordId];
      return {
        id: item.id,
        productRecordId: item.productRecordId,
        product: product
          ? {
              recordId: product.recordId,
              name: product.name,
              identifier: product.identifier,
              slug: product.slug,
              price: product.price,
              discountPrice: product.discountPrice,
              offer: product.offer,
              stock: product.stock,
              status: product.status,
              images: product.images,
              carouselImages: product.carouselImages,
              brand: product.brand,
              category: product.category,
              subcategory: product.subcategory,
              ratings: product.ratings,
              highlights: product.highlights,
              description: product.description,
            }
          : null,
        addedAt: item.addedAt,
      };
    });

    return successResponse(res, "Wishlist retrieved successfully", {
      wishlist: {
        id: wishlist.id,
        itemCount: wishlist.itemCount,
        items: itemsWithProducts,
      },
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const { userId } = req.body;
    const userRecordIdFromToken = req.user.recordId;

    if (userId !== userRecordIdFromToken) {
      return errorResponse(res, "Unauthorized access", 403);
    }

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const wishlist = await Wishlist.findOne({ userRecordId: userId });

    if (!wishlist) {
      return errorResponse(res, "Wishlist not found", 404);
    }

    // Remove all items
    for (const item of wishlist.items) {
      await Wishlist.removeItem(userId, item.productRecordId);
    }
    wishlist = await Wishlist.findOne({ userRecordId: userId });

    return successResponse(res, "Wishlist cleared successfully", {
      wishlist: {
        id: wishlist.id,
        itemCount: 0,
        items: [],
      },
    });
  } catch (error) {
    console.error("Clear Wishlist Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const getWishlistCount = async (req, res) => {
  try {
    const { userId } = req.body;
    const userRecordIdFromToken = req.user.recordId;

    if (userId !== userRecordIdFromToken) {
      return errorResponse(res, "Unauthorized access", 403);
    }

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const wishlist = await Wishlist.findOne({ userRecordId: userId });

    const count = wishlist ? wishlist.itemCount : 0;

    return successResponse(res, "Wishlist count retrieved", {
      count: count,
    });
  } catch (error) {
    console.error("Get Wishlist Count Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const checkProductInWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const userRecordIdFromToken = req.user.recordId;

    // console.log("Received data:", { userId, productId, userRecordIdFromToken });

    if (userId !== userRecordIdFromToken) {
      return errorResponse(res, "Unauthorized access", 403);
    }

    if (!productId || !userId) {
      return errorResponse(res, "User ID and Product ID are required", 400);
    }

    const wishlist = await Wishlist.findOne({ userRecordId: userId });
    const isInWishlist =
      wishlist &&
      wishlist.items.some((item) => item.productRecordId === productId);

    return successResponse(res, "Product wishlist status checked", {
      isInWishlist: isInWishlist,
      productId: productId,
    });
  } catch (error) {
    console.error("Check Product in Wishlist Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const getWishlistProducts = async (req, res) => {
  try {
    const { userId, page = 1, limit = 10 } = req.body;
    const userRecordIdFromToken = req.user.recordId;

    if (userId !== userRecordIdFromToken) {
      return errorResponse(res, "Unauthorized access", 403);
    }

    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    const wishlist = await Wishlist.findOne({ userRecordId: userId });

    if (!wishlist || wishlist.items.length === 0) {
      return successResponse(res, "No products in wishlist", {
        products: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalProducts: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedItems = wishlist.items.slice(startIndex, endIndex);
    const productRecordIds = paginatedItems.map((item) => item.productRecordId);

    const products = await Product.find({
      recordId: productRecordIds,
    });

    const orderedProducts = paginatedItems
      .map((item) => {
        const product = products.find(
          (p) => p.recordId === item.productRecordId
        );
        return product
          ? {
              recordId: product.recordId,
              name: product.name,
              identifier: product.identifier,
              slug: product.slug,
              price: product.price,
              discountPrice: product.discountPrice,
              offer: product.offer,
              stock: product.stock,
              status: product.status,
              images: product.images,
              carouselImages: product.carouselImages,
              brand: product.brand,
              category: product.category,
              subcategory: product.subcategory,
              ratings: product.ratings,
              highlights: product.highlights,
              description: product.description,
              addedToWishlistAt: item.addedAt,
            }
          : null;
      })
      .filter((product) => product !== null);

    const totalPages = Math.ceil(wishlist.items.length / limit);

    return successResponse(res, "Wishlist products retrieved successfully", {
      products: orderedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalProducts: wishlist.items.length,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get Wishlist Products Error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};
