import { Hono } from "hono";
import {
  addTax,
  editTax,
  deleteTax,
  getAllTaxes,
  getTaxByRecordId,
  getTaxes,
} from "../controller/tax.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();
router.use("*",);

router.post("/tax/add", expressToHono(addTax));
router.post("/tax/edit", expressToHono(editTax));
router.post("/tax/delete", expressToHono(deleteTax));
router.get("/tax", expressToHono(getAllTaxes));
router.post("/tax/getedit", expressToHono(getTaxByRecordId));
router.get("/tax/get", expressToHono(getTaxes));

export default router;
