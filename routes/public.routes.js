import express from "express";
import { getAllBanners, recordBannerClick } from "../controller/banner.controller.js";
import { getAllProducts, getFilteredProducts, getProductByslug, getTrendingProducts } from "../controller/product.controller.js";
import { Categories, getCategories, getSubcategories } from "../controller/category.controller.js";
import { getAllFAQs } from "../controller/faq.controller.js";

const router = express.Router();

router.get("/banners/all", getAllBanners);
router.post("/banners/click", recordBannerClick);
router.get("/products/get", getAllProducts);
router.get("/products/trendingProducts", getTrendingProducts);

router.post("/products/getslug", getProductByslug);
router.post("/products/filter", getFilteredProducts);
router.get("/category/getCategories", getCategories);     
router.get("/category/subcategories", getSubcategories); 
router.get("/category/get", Categories); 


//fqa routes
router.get("/faq/all", getAllFAQs);



export default router;