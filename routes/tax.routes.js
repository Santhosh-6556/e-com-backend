import express from "express";
import {
  addTax,
  editTax,
  deleteTax,
  getAllTaxes,
  getTaxByRecordId,
  getTaxes,
} from "../controller/tax.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware(["user", "admin"]));

router.post("/tax/add", addTax);
router.post("/tax/edit", editTax);
router.post("/tax/delete", deleteTax);
router.get("/tax", getAllTaxes);
router.post("/tax/getedit", getTaxByRecordId);
router.get("/tax/get", getTaxes);

export default router;
