import express from "express";

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

const router = express.Router();

router.use(authMiddleware(["user", "admin"]));

router.post("/wishlist/add", addToWishlist);
router.post("/wishlist/remove", removeFromWishlist);
router.post("/wishlist", getWishlist);
router.post("/wishlist/products", getWishlistProducts);
router.post("/wishlist/clear", clearWishlist);
router.post("/wishlist/count", getWishlistCount);
router.post("/wishlist/check", checkProductInWishlist);

export default router;
