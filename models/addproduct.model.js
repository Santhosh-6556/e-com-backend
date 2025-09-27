import mongoose from "mongoose";

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
  
  name: { type: String },
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

  price: { type: Number, required: true },
  discountPrice: { type: Number },
  offer: { type: Number, default: 0 },

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

productSchema.pre("save", function (next) {
  this.lastModified = Date.now();

  if (this.price && this.discountPrice) {
    this.offer = Math.round(
      ((this.price - this.discountPrice) / this.price) * 100
    );
  } else {
    this.offer = 0;
  }

  if (this.reviews && this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.ratings.average = parseFloat((total / this.reviews.length).toFixed(1));
    this.ratings.count = this.reviews.length;
  } else {
    this.ratings.average = 0;
    this.ratings.count = 0;
  }

  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
