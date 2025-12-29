import { Hono } from "hono";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  getBanners,
  getBannerByRecordId,
  recordBannerClick,
  getAllBanners,
} from "../controller/banner.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.get("/banners/all", expressToHono(getAllBanners));
router.post("/banners/click", expressToHono(recordBannerClick));

router.get("/banners", authMiddleware(["admin"]), expressToHono(getBanners));
router.post(
  "/banners/add",
  authMiddleware(["admin"]),
  expressToHono(createBanner)
);
router.post(
  "/banners/edit",
  authMiddleware(["admin"]),
  expressToHono(updateBanner)
);
router.post(
  "/banners/delete",
  authMiddleware(["admin"]),
  expressToHono(deleteBanner)
);
router.post(
  "/banners/getedit",
  authMiddleware(["admin"]),
  expressToHono(getBannerByRecordId)
);

export default router;
