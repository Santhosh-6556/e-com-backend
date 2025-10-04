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


router.get("/banners/all", getAllBanners);
router.post("/banners/click", recordBannerClick);

router.get("/banners", authMiddleware(["admin"]), getBanners);
router.post("/banners/add", authMiddleware(["admin"]), createBanner);
router.post("/banners/edit", authMiddleware(["admin"]), updateBanner);
router.post("/banners/delete", authMiddleware(["admin"]), deleteBanner);
router.post("/banners/getedit", authMiddleware(["admin"]), getBannerByRecordId);

export default router;