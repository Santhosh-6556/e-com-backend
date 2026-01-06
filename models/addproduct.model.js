import mongoose from "mongoose";
import Tax from "../models/tax.model.js"; 

const attributeSchema = new mongoose.Schema(
  {
    header: { type: String, required: true },
    subHeader: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const Features = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const descriptionSchema = new mongoose.Schema(
  {
    text: { type: String },
    image: { type: String },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    reviewText: { type: String },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },

  identifier: { type: String, required: true },
  slug: { type: String, required: true },
  brand: {
    recordId: { type: String },
    identifier: { type: String },
  },
  subcategory: {
    recordId: { type: String },
    identifier: { type: String },
  },
  category: {
    recordId: { type: String, required: true },
    identifier: { type: String },
  },
  tax: {
    recordId: { type: String },
    identifier: { type: String },
  },
  price: { type: Number, required: true }, 
  discountPrice: { type: Number },         
  offer: { type: Number, default: 0 },    

  sellingPrice: { type: Number, default: 0 }, 

  stock: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
  isTrending: { type: Boolean, default: false },

  images: [{ type: String }],
  carouselImages: [{ type: String }],
  highlights: [{ type: String }],
  description: { type: String },
  productDescription: [descriptionSchema],

  attributes: [attributeSchema],
  Features: [Features],

  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  reviews: [reviewSchema],

  // Metadata
  createdBy: { type: String, required: true },
  modifiedBy: { type: String },
  creationTime: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
});


productSchema.pre("save", async function (next) {
  this.lastModified = Date.now();


  if (this.price && this.discountPrice) {
    this.offer = Math.round(
      ((this.price - this.discountPrice) / this.price) * 100
    );
  } else {
    this.offer = 0;
  }

  // 2. Calculate Ratings
  if (this.reviews && this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.ratings.average = parseFloat((total / this.reviews.length).toFixed(1));
    this.ratings.count = this.reviews.length;
  } else {
    this.ratings.average = 0;
    this.ratings.count = 0;
  }


  let basePrice = this.discountPrice || this.price; 
  let sellingPrice = basePrice;

  if (this.tax && this.tax.recordId) {
    try {
      const taxRecord = await mongoose.model("Tax").findOne({
        recordId: this.tax.recordId,
        status: true,
      });

      if (taxRecord && taxRecord.rate) {
        const taxRate = parseFloat(taxRecord.rate);
        if (!isNaN(taxRate)) {
          sellingPrice = basePrice + (basePrice * taxRate) / 100;
        }
      }
    } catch (err) {
      console.error("Error fetching tax:", err);
    }
  }

  this.sellingPrice = parseFloat(sellingPrice.toFixed(2));

  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
