import express from "express";
import {
  addProduct,
  editProduct,
  deleteProduct,
  getAllProducts,
  getProductByRecordId,
  getFilteredProducts,
  Products,
  getProductByslug,
} from "../controller/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/products/add", authMiddleware(["admin"]), addProduct);
router.post("/products/edit", authMiddleware(["admin"]), editProduct);
router.post("/products/delete", authMiddleware(["admin"]), deleteProduct);
router.get("/products/get", getAllProducts);
router.post("/products/getedit", authMiddleware(["admin", "user"]), getProductByRecordId);
router.post("/products/getslug", getProductByslug);
router.post("/products/filter", getFilteredProducts);
router.get("/products",authMiddleware(["admin"]), Products);

export default router;
