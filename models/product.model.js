import { getD1 } from "../config/d1.js";

const parseJSON = (value) => {
  if (!value) return null;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};

const stringifyJSON = (value) => {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
};

const rowToProduct = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    identifier: row.identifier,
    slug: row.slug,
    brand: row.brandRecordId
      ? {
          recordId: row.brandRecordId,
          identifier: row.brandIdentifier,
        }
      : null,
    subcategory: row.subcategoryRecordId
      ? {
          recordId: row.subcategoryRecordId,
          identifier: row.subcategoryIdentifier,
        }
      : null,
    category: {
      recordId: row.categoryRecordId,
      identifier: row.categoryIdentifier,
    },
    tax: row.taxRecordId
      ? {
          recordId: row.taxRecordId,
          identifier: row.taxIdentifier,
        }
      : null,
    price: row.price,
    discountPrice: row.discountPrice,
    offer: row.offer || 0,
    sellingPrice: row.sellingPrice || 0,
    stock: row.stock || 0,
    status: row.status === 1,
    isTrending: row.isTrending === 1,
    images: parseJSON(row.images) || [],
    carouselImages: parseJSON(row.carouselImages) || [],
    highlights: parseJSON(row.highlights) || [],
    description: row.description,
    productDescription: parseJSON(row.productDescription) || [],
    attributes: parseJSON(row.attributes) || [],
    Features: parseJSON(row.features) || [],
    ratings: {
      average: row.ratingsAverage || 0,
      count: row.ratingsCount || 0,
    },
    reviews: parseJSON(row.reviews) || [],
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

class ProductModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const product = await this.db.findOne("products", filter);
    return product ? rowToProduct(product) : null;
  }

  async find(filter = {}, options = {}) {
    const products = await this.db.find("products", filter, options);
    return products.map(rowToProduct);
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);

    let offer = 0;
    if (data.price && data.discountPrice) {
      offer = Math.round(
        ((data.price - data.discountPrice) / data.price) * 100
      );
    }

    let ratingsAverage = 0;
    let ratingsCount = 0;
    if (data.reviews && data.reviews.length > 0) {
      const total = data.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      ratingsAverage = parseFloat((total / data.reviews.length).toFixed(1));
      ratingsCount = data.reviews.length;
    }

    let sellingPrice = data.discountPrice || data.price || 0;
    if (data.tax?.recordId) {
      try {
        const tax = await this.db.findOne("taxes", {
          recordId: data.tax.recordId,
          status: 1,
        });
        if (tax && tax.rate) {
          const taxRate = parseFloat(tax.rate);
          if (!isNaN(taxRate)) {
            sellingPrice = sellingPrice + (sellingPrice * taxRate) / 100;
          }
        }
      } catch (err) {
        console.error("Error fetching tax:", err);
      }
    }
    sellingPrice = parseFloat(sellingPrice.toFixed(2));

    const productData = {
      recordId: data.recordId,
      identifier: data.identifier,
      slug: data.slug,
      brandRecordId: data.brand?.recordId || null,
      brandIdentifier: data.brand?.identifier || null,
      subcategoryRecordId: data.subcategory?.recordId || null,
      subcategoryIdentifier: data.subcategory?.identifier || null,
      categoryRecordId: data.category?.recordId || data.categoryRecordId,
      categoryIdentifier: data.category?.identifier || null,
      taxRecordId: data.tax?.recordId || null,
      taxIdentifier: data.tax?.identifier || null,
      price: data.price,
      discountPrice: data.discountPrice || null,
      offer: offer,
      sellingPrice: sellingPrice,
      stock: data.stock || 0,
      status: data.status !== false ? 1 : 0,
      isTrending: data.isTrending ? 1 : 0,
      images: stringifyJSON(data.images),
      carouselImages: stringifyJSON(data.carouselImages),
      highlights: stringifyJSON(data.highlights),
      description: data.description || null,
      productDescription: stringifyJSON(data.productDescription),
      attributes: stringifyJSON(data.attributes),
      features: stringifyJSON(data.Features || data.features),
      ratingsAverage: ratingsAverage,
      ratingsCount: ratingsCount,
      reviews: stringifyJSON(data.reviews),
      createdBy: data.createdBy,
      modifiedBy: data.modifiedBy || null,
      creationTime: now,
      lastModified: now,
    };

    await this.db.insertOne("products", productData);
    return this.findOne({ recordId: data.recordId });
  }

  async updateOne(filter, update) {
    const updateData = {
      ...update,
      lastModified: Math.floor(Date.now() / 1000),
    };

    if (update.brand) {
      updateData.brandRecordId = update.brand.recordId;
      updateData.brandIdentifier = update.brand.identifier;
      delete updateData.brand;
    }
    if (update.subcategory) {
      updateData.subcategoryRecordId = update.subcategory.recordId;
      updateData.subcategoryIdentifier = update.subcategory.identifier;
      delete updateData.subcategory;
    }
    if (update.category) {
      updateData.categoryRecordId = update.category.recordId;
      updateData.categoryIdentifier = update.category.identifier;
      delete updateData.category;
    }
    if (update.tax) {
      updateData.taxRecordId = update.tax.recordId;
      updateData.taxIdentifier = update.tax.identifier;
      delete updateData.tax;
    }

    if (update.images) updateData.images = stringifyJSON(update.images);
    if (update.carouselImages)
      updateData.carouselImages = stringifyJSON(update.carouselImages);
    if (update.highlights)
      updateData.highlights = stringifyJSON(update.highlights);
    if (update.productDescription)
      updateData.productDescription = stringifyJSON(update.productDescription);
    if (update.attributes)
      updateData.attributes = stringifyJSON(update.attributes);
    if (update.Features) updateData.features = stringifyJSON(update.Features);
    if (update.features) updateData.features = stringifyJSON(update.features);
    if (update.reviews) updateData.reviews = stringifyJSON(update.reviews);

    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;
    if (update.isTrending !== undefined)
      updateData.isTrending = update.isTrending ? 1 : 0;

    // Recalculate offer if price or discountPrice changed
    if (update.price !== undefined || update.discountPrice !== undefined) {
      const current = await this.findOne(filter);
      if (current) {
        const price = update.price !== undefined ? update.price : current.price;
        const discountPrice =
          update.discountPrice !== undefined
            ? update.discountPrice
            : current.discountPrice;
        if (price && discountPrice) {
          updateData.offer = Math.round(
            ((price - discountPrice) / price) * 100
          );
        }
      }
    }

    // Recalculate ratings if reviews changed
    if (update.reviews) {
      const reviews = parseJSON(update.reviews) || [];
      if (reviews.length > 0) {
        const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        updateData.ratingsAverage = parseFloat(
          (total / reviews.length).toFixed(1)
        );
        updateData.ratingsCount = reviews.length;
      } else {
        updateData.ratingsAverage = 0;
        updateData.ratingsCount = 0;
      }
    }

    await this.db.updateOne("products", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("products", filter);
    return true;
  }
}

let productModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!productModelInstance) productModelInstance = new ProductModel();
    return productModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!productModelInstance) productModelInstance = new ProductModel();
    return productModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!productModelInstance) productModelInstance = new ProductModel();
    return productModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!productModelInstance) productModelInstance = new ProductModel();
    return productModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!productModelInstance) productModelInstance = new ProductModel();
    return productModelInstance.deleteOne(filter);
  },
};
