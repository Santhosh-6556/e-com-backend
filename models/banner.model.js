
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },
  
  
  identifier: { type: String, required: true },
  subtitle: { type: String },
  image: { type: String, required: true }, 
  mobileImage: { type: String },
  
  
  type: { 
    type: String, 
    enum: ['home', 'category', 'product', 'promotional', 'sidebar'],
    required: true 
  },
  position: { type: Number, default: 0 }, 
  status: { type: Boolean, default: true },
  

  actionType: {
    type: String,
    enum: ['product', 'category', 'url', 'none'],
    default: 'none'
  },
  targetProduct: {
    recordId: { type: String },
    slug: { type: String }
  },
  targetCategory: {
    recordId: { type: String },
    identifier: { type: String }
  },
  customUrl: { type: String },
  
  
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  displayPriority: { type: Number, default: 1 },
  
  
  textColor: { type: String, default: '#ffffff' },
  backgroundColor: { type: String, default: 'transparent' },
  buttonText: { type: String },
  buttonColor: { type: String, default: '#007bff' },

  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
 
  createdBy: { type: String, required: true },
  modifiedBy: { type: String },
  creationTime: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
  status: { type: Boolean, default: true },

});


bannerSchema.index({ type: 1, status: 1, position: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ "targetProduct.slug": 1 });

bannerSchema.pre("save", function (next) {
  this.lastModified = Date.now();
  next();
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;