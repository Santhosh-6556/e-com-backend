import { Hono } from "hono";
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  getAllOrders,
} from "../controller/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.post(
  "/order/create",
  authMiddleware(["admin", "user"]),
  expressToHono(createOrder)
);
router.post(
  "/verify-payment",
  authMiddleware(["admin", "user"]),
  expressToHono(verifyPayment)
);
router.post(
  "/order/user-orders",
  authMiddleware(["admin", "user"]),
  expressToHono(getUserOrders)
);
router.post(
  "/order/details",
  authMiddleware(["admin", "user"]),
  expressToHono(getOrderDetails)
);
router.post(
  "/order/cancel-order",
  authMiddleware(["admin", "user"]),
  expressToHono(cancelOrder)
);
router.get(
  "/order/getall",
  authMiddleware(["user", "admin"]),
  expressToHono(getAllOrders)
);

export default router;
