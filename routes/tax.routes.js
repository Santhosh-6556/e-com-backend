import express from "express";
import {
  addTax,
  editTax,
  deleteTax,
  getAllTaxes,
  getTaxByRecordId,
} from "../controller/tax.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/tax/add", authMiddleware(["admin"]), addTax);
router.post("/tax/edit", authMiddleware(["admin"]), editTax);
router.post("/tax/delete", authMiddleware(["admin"]), deleteTax);
router.get("/tax", getAllTaxes);
router.post("/tax/get", getTaxByRecordId);

export default router;
