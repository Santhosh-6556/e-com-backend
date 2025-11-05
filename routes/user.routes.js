import { Hono } from "hono";
import {
  addAddress,
  updateAddress,
  deleteAddress,
  getAddresses,
  updateUserProfile,
  getUserProfile,
} from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.get(
  "/user/get",
  authMiddleware(["user", "admin"]),
  expressToHono(getUserProfile)
);
router.post(
  "/user/address/add",
  authMiddleware(["user", "admin"]),
  expressToHono(addAddress)
);
router.post(
  "/user/update",
  authMiddleware(["user", "admin"]),
  expressToHono(updateUserProfile)
);
router.post(
  "/user/address/update",
  authMiddleware(["user", "admin"]),
  expressToHono(updateAddress)
);
router.post(
  "/user/address/delete",
  authMiddleware(["user", "admin"]),
  expressToHono(deleteAddress)
);
router.post(
  "/user/address/get",
  authMiddleware(["user", "admin"]),
  expressToHono(getAddresses)
);

export default router;
