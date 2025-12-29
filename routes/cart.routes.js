import { Hono } from "hono";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controller/cart.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.post(
  "/cart/get",
  authMiddleware(["user", "admin"]),
  expressToHono(getCart)
);
router.post(
  "/cart/add",
  authMiddleware(["user", "admin"]),
  expressToHono(addToCart)
);
router.post(
  "/cart/update",
  authMiddleware(["user", "admin"]),
  expressToHono(updateCartItem)
);
router.post(
  "/cart/remove",
  authMiddleware(["user", "admin"]),
  expressToHono(removeFromCart)
);
router.post(
  "/cart/clear",
  authMiddleware(["user", "admin"]),
  expressToHono(clearCart)
);

export default router;
