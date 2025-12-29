import { getD1 } from "../config/d1.js";

/* ---------- Utility Functions ---------- */
const parseJSON = (value) => {
  if (value === null || value === undefined) return null;
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

/* ---------- Product Row Mapper ---------- */
const rowToProduct = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    identifier: row.identifier,
    slug: row.slug,
    brand: row.brandRecordId
      ? { recordId: row.brandRecordId, identifier: row.brandIdentifier }
      : null,
    subcategory: row.subcategoryRecordId
      ? { recordId: row.subcategoryRecordId, identifier: row.subcategoryIdentifier }
      : null,
    category: row.categoryRecordId
      ? { recordId: row.categoryRecordId, identifier: row.categoryIdentifier }
      : null,
    tax: row.taxRecordId
      ? { recordId: row.taxRecordId, identifier: row.taxIdentifier }
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
    description: row.description || null,
    productDescription: parseJSON(row.productDescription) || [],
    attributes: parseJSON(row.attributes) || [],
    Features: parseJSON(row.features) || [],
    ratings: { average: row.ratingsAverage || 0, count: row.ratingsCount || 0 },
    reviews: parseJSON(row.reviews) || [],

    createdBy: row.createdBy,
    modifiedBy: row.modifiedBy,
    creationTime: row.creationTime ? new Date(row.creationTime * 1000) : new Date(),
    lastModified: row.lastModified ? new Date(row.lastModified * 1000) : new Date(),
  };
};

/* ---------- Product Model ---------- */
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

    const offer =
      data.price && data.discountPrice
        ? Math.round(((data.price - data.discountPrice) / data.price) * 100)
        : 0;

    const reviews = data.reviews || [];
    const ratingsCount = reviews.length;
    const ratingsAverage =
      ratingsCount > 0
        ? parseFloat(
            (
              reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsCount
            ).toFixed(1)
          )
        : 0;

    // Calculate selling price (with tax)
    let sellingPrice = data.discountPrice || data.price || 0;
    if (data.tax?.recordId) {
      try {
        const tax = await this.db.findOne("taxes", {
          recordId: data.tax.recordId,
          status: 1,
        });
        if (tax?.rate) {
          const taxRate = parseFloat(tax.rate);
          if (!isNaN(taxRate)) {
            sellingPrice = sellingPrice + (sellingPrice * taxRate) / 100;
          }
        }
      } catch (err) {
        console.error("Tax fetch error:", err);
      }
    }

    const productData = {
      recordId: data.recordId,
      identifier: data.identifier,
      slug: data.slug,

      brandRecordId: data.brand?.recordId || null,
      brandIdentifier: data.brand?.identifier || null,
      subcategoryRecordId: data.subcategory?.recordId || null,
      subcategoryIdentifier: data.subcategory?.identifier || null,
      categoryRecordId: data.category?.recordId || null,
      categoryIdentifier: data.category?.identifier || null,
      taxRecordId: data.tax?.recordId || null,
      taxIdentifier: data.tax?.identifier || null,

      price: data.price,
      discountPrice: data.discountPrice || null,
      offer,
      sellingPrice: parseFloat(sellingPrice.toFixed(2)),
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
      reviews: stringifyJSON(reviews),

      ratingsAverage,
      ratingsCount,
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

    // 🔄 Flatten nested objects
    const mapFields = ["brand", "subcategory", "category", "tax"];
    for (const f of mapFields) {
      if (update[f]) {
        updateData[`${f}RecordId`] = update[f].recordId;
        updateData[`${f}Identifier`] = update[f].identifier;
        delete updateData[f];
      }
    }

    // 🧠 JSON fields stringified
    const jsonFields = [
      "images",
      "carouselImages",
      "highlights",
      "productDescription",
      "attributes",
      "Features",
      "features",
      "reviews",
    ];
    for (const key of jsonFields) {
      if (update[key] !== undefined) {
        updateData[key === "Features" ? "features" : key] = stringifyJSON(update[key]);
      }
    }

    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;
    if (update.isTrending !== undefined)
      updateData.isTrending = update.isTrending ? 1 : 0;

    // 🧮 Offer recalculation
    if (update.price !== undefined || update.discountPrice !== undefined) {
      const current = await this.findOne(filter);
      if (current) {
        const price = update.price ?? current.price;
        const discountPrice = update.discountPrice ?? current.discountPrice;
        if (price && discountPrice) {
          updateData.offer = Math.round(((price - discountPrice) / price) * 100);
        }
      }
    }

    // ⭐ Ratings recalculation
    if (update.reviews) {
      const reviews = parseJSON(update.reviews) || [];
      const count = reviews.length;
      const avg =
        count > 0
          ? parseFloat(
              (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1)
            )
          : 0;
      updateData.ratingsAverage = avg;
      updateData.ratingsCount = count;
    }

    await this.db.updateOne("products", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("products", filter);
    return true;
  }
}

/* ---------- Export Singleton ---------- */
let instance = null;
export default {
  findOne: (filter) => (instance ??= new ProductModel()).findOne(filter),
  find: (filter, options) => (instance ??= new ProductModel()).find(filter, options),
  create: (data) => (instance ??= new ProductModel()).create(data),
  updateOne: (filter, update) =>
    (instance ??= new ProductModel()).updateOne(filter, update),
  deleteOne: (filter) => (instance ??= new ProductModel()).deleteOne(filter),
};
