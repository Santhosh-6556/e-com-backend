import express from "express";
import {
  addCategory,
  editCategory,
  deleteCategory,
  getAllCategories,
  getCategoryByRecordId,
  getCategories,
  getSubcategories,
  Categories,
  getCategory,
} from "../controller/category.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/category/add", authMiddleware(["admin"]), addCategory);
router.post("/category/edit", authMiddleware(["admin"]), editCategory);
router.post("/category/delete", authMiddleware(["admin"]), deleteCategory);
router.get("/category/get", authMiddleware(["admin", "user"]), getAllCategories);
router.post("/category/getedit", authMiddleware(["admin", "user"]), getCategoryByRecordId);
router.get("/category", authMiddleware(["admin", "user"]), getCategory);

export default router;
