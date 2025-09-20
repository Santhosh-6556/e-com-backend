import express from "express";
import {
  addCategory,
  editCategory,
  deleteCategory,
  getAllCategories,
  getCategoryByRecordId,
  getCategories,
  getSubcategories,
} from "../controller/category.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// CRUD APIs for Category/SubCategory/Brand
router.post("/category/add", authMiddleware(["admin"]), addCategory);
router.post("/category/edit", authMiddleware(["admin"]), editCategory);
router.post("/category/delete", authMiddleware(["admin"]), deleteCategory);
router.get("/category/get", authMiddleware(["admin", "user"]), getAllCategories);
router.post("/category/getedit", authMiddleware(["admin", "user"]), getCategoryByRecordId);
router.get("/category/getCategories", getCategories);     
router.get("/category/subcategories", getSubcategories); 


export default router;
