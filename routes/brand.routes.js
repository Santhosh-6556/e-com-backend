import { Hono } from "hono";
import {
  addBrand,
  editBrand,
  deleteBrand,
  getAllBrand,
  getBrandByRecordId,
  Brands,
} from "../controller/brand.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

// CRUD APIs for Brand/Brand
router.post("/brand/add", authMiddleware(["admin"]), expressToHono(addBrand));
router.post("/brand/edit", authMiddleware(["admin"]), expressToHono(editBrand));
router.post(
  "/brand/delete",
  authMiddleware(["admin"]),
  expressToHono(deleteBrand)
);
router.get(
  "/brand/get",
  authMiddleware(["admin", "user"]),
  expressToHono(getAllBrand)
);
router.get("/brand", authMiddleware(["admin", "user"]), expressToHono(Brands));
router.post(
  "/brand/getedit",
  authMiddleware(["admin", "user"]),
  expressToHono(getBrandByRecordId)
);

export default router;
