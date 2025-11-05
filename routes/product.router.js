import { Hono } from "hono";
import {
  addProduct,
  editProduct,
  deleteProduct,
  getProductByRecordId,
  Products,
  getAdminProducts,
} from "../controller/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.post(
  "/products/add",
  authMiddleware(["admin"]),
  expressToHono(addProduct)
);
router.post(
  "/products/edit",
  authMiddleware(["admin"]),
  expressToHono(editProduct)
);
router.post(
  "/products/delete",
  authMiddleware(["admin"]),
  expressToHono(deleteProduct)
);
router.post(
  "/products/getedit",
  authMiddleware(["admin", "user"]),
  expressToHono(getProductByRecordId)
);
router.get("/products", authMiddleware(["admin"]), expressToHono(Products));
router.get(
  "/products/get",
  authMiddleware(["admin"]),
  expressToHono(getAdminProducts)
);

export default router;
