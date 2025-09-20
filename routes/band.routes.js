import express from "express";
import {
  addBrand,
  editBrand,
  deleteBrand,
  getAllCategories,
  getBrandByRecordId,
} from "../controller/brand.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// CRUD APIs for Brand/Brand
router.post("/brand/add", authMiddleware(["admin"]), addBrand);
router.post("/brand/edit", authMiddleware(["admin"]), editBrand);
router.post("/brand/delete", authMiddleware(["admin"]), deleteBrand);
router.get("/brand/get", authMiddleware(["admin", "user"]), getAllCategories);
router.post("/brand/getedit", authMiddleware(["admin", "user"]), getBrandByRecordId);

export default router;
