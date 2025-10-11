import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from "../controller/cart.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/cart/get", authMiddleware(["user", "admin"]), getCart);
router.post("/cart/add", authMiddleware(["user", "admin"]), addToCart);
router.post("/cart/update", authMiddleware(["user", "admin"]), updateCartItem);
router.post("/cart/remove", authMiddleware(["user", "admin"]), removeFromCart);
router.post("/cart/clear", authMiddleware(["user", "admin"]), clearCart);

export default router;