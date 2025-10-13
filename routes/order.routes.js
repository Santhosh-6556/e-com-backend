import express from "express";
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderDetails,
  cancelOrder
} from "../controller/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/order/create", authMiddleware(["admin", "user"]), createOrder);
router.post("/verify-payment",authMiddleware(["admin", "user"]), verifyPayment);
router.post("/order/user-orders", authMiddleware(["admin", "user"]), getUserOrders);
router.post("/order/details", authMiddleware(["admin", "user"]), getOrderDetails);
router.post("/cancel", authMiddleware(["admin", "user"]), cancelOrder);

export default router;