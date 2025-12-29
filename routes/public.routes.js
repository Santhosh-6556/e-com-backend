import { Hono } from "hono";
import {
  getAllBanners,
  recordBannerClick,
} from "../controller/banner.controller.js";
import {
  getAllProducts,
  getFilteredProducts,
  getProductByslug,
  getTrendingProducts,
} from "../controller/product.controller.js";
import {
  Categories,
  getCategories,
  getSubcategories,
} from "../controller/category.controller.js";
import { getAllFAQs } from "../controller/faq.controller.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.get("/banners/all", expressToHono(getAllBanners));
router.post("/banners/click", expressToHono(recordBannerClick));
router.get("/products/get", expressToHono(getAllProducts));
router.get("/products/trendingProducts", expressToHono(getTrendingProducts));

router.post("/products/getslug", expressToHono(getProductByslug));
router.post("/products/filter", expressToHono(getFilteredProducts));
router.get("/category/getCategories", expressToHono(getCategories));
router.get("/category/subcategories", expressToHono(getSubcategories));
router.get("/category/get", expressToHono(Categories));

// FAQ routes
router.get("/faq/all", expressToHono(getAllFAQs));

export default router;
