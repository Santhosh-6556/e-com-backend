import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  addToWishlist,
  checkProductInWishlist,
  clearWishlist,
  getWishlist,
  getWishlistCount,
  getWishlistProducts,
  removeFromWishlist,
} from "../controller/wishlist.controller.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.use("*", authMiddleware(["user", "admin"]));

router.post("/wishlist/add", expressToHono(addToWishlist));
router.post("/wishlist/remove", expressToHono(removeFromWishlist));
router.post("/wishlist", expressToHono(getWishlist));
router.post("/wishlist/products", expressToHono(getWishlistProducts));
router.post("/wishlist/clear", expressToHono(clearWishlist));
router.post("/wishlist/count", expressToHono(getWishlistCount));
router.post("/wishlist/check", expressToHono(checkProductInWishlist));

export default router;
