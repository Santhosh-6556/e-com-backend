import express from "express";
import {
  addAddress,
  updateAddress,
  deleteAddress,
  
  getAddresses,
} from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/user/address/add", authMiddleware(["user", "admin"]), addAddress);
router.post("/user/address/update", authMiddleware(["user", "admin"]), updateAddress);
router.post("/user/address/delete", authMiddleware(["user", "admin"]), deleteAddress);
router.post("/user/address/get", authMiddleware(["user", "admin"]), getAddresses);

export default router;
