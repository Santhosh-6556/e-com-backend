import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  addFAQ,
  deleteFAQ,
  editFAQ,
  getAllFAQs,
  getFAQByRecordId,
} from "../controller/faq.controller.js";

const router = express.Router();
router.use(authMiddleware(["user", "admin"]));

router.post("/faq/add", addFAQ);
router.post("/faq/edit", editFAQ);
router.post("/faq/delete", deleteFAQ);
router.get("/fqa", getAllFAQs);
router.post("/faq/getedit", getFAQByRecordId);
// router.get("/tax/get", getTaxes);

export default router;
