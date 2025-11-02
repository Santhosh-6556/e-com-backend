import express from "express";
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  getAllOrders
} from "../controller/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/order/create", authMiddleware(["admin", "user"]), createOrder);
router.post("/verify-payment",authMiddleware(["admin", "user"]), verifyPayment);
router.post("/order/user-orders", authMiddleware(["admin", "user"]), getUserOrders);
router.post("/order/details", authMiddleware(["admin", "user"]), getOrderDetails);
router.post("/order/cancel-order", authMiddleware(["admin", "user"]), cancelOrder);
router.get("/order/getall", authMiddleware(["user", "admin"]), getAllOrders);


export default router;