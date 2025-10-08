import express from "express";
import {
  addProduct,
  editProduct,
  deleteProduct,
  getProductByRecordId,
  Products,
  getAdminProducts,
} from "../controller/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/products/add", authMiddleware(["admin"]), addProduct);
router.post("/products/edit", authMiddleware(["admin"]), editProduct);
router.post("/products/delete", authMiddleware(["admin"]), deleteProduct);
router.post(
  "/products/getedit",
  authMiddleware(["admin", "user"]),
  getProductByRecordId
);
router.get("/products", authMiddleware(["admin"]), Products);
router.get("/products/get", authMiddleware(["admin"]), getAdminProducts);

export default router;
