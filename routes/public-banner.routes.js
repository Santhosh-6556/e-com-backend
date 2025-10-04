import express from "express";
import { getAllBanners, recordBannerClick } from "../controller/banner.controller.js";

const router = express.Router();

router.get("/banners/all", getAllBanners);
router.post("/banners/click", recordBannerClick);

export default router;