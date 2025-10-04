import express from "express";
import { getAllBanners, recordBannerClick } from "../controller/banner.controller.js";
import { getAllProducts, getFilteredProducts, getProductByslug } from "../controller/product.controller.js";
import { Categories, getCategories, getSubcategories } from "../controller/category.controller.js";

const router = express.Router();

router.get("/banners/all", getAllBanners);
router.post("/banners/click", recordBannerClick);
router.get("/products/get", getAllProducts);

router.post("/products/getslug", getProductByslug);
router.post("/products/filter", getFilteredProducts);
router.get("/category/getCategories", getCategories);     
router.get("/category/subcategories", getSubcategories); 
router.get("/category/get", Categories); 

export default router;