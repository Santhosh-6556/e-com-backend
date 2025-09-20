import express from "express";
import {
  addProduct,
  editProduct,
  deleteProduct,
  getAllProducts,
  getProductByRecordId,
  getFilteredProducts,
} from "../controller/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware(["admin"]), addProduct);
router.post("/edit", authMiddleware(["admin"]), editProduct);
router.post("/delete", authMiddleware(["admin"]), deleteProduct);
router.get("/get", getAllProducts);
router.get("/:recordId", authMiddleware(["admin", "user"]), getProductByRecordId);
router.post("/filter", getFilteredProducts);

export default router;
