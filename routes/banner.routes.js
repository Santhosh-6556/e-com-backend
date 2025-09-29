
import express from "express";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  getBanners,
  getBannerByRecordId,
  recordBannerClick,
  getAllBanners
} from "../controller/banner.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();


router.get("/banners",authMiddleware(["admin"]), getBanners);
router.post("/banners/click", recordBannerClick);


router.post("/banners/add", authMiddleware(["admin"]), createBanner);
router.post("/banners/edit", authMiddleware(["admin"]), updateBanner);
router.post("/banners/delete", authMiddleware(["admin"]), deleteBanner);
router.post("/banners/get",  getBannerByRecordId);
router.get("/banners/all", getAllBanners);

export default router;