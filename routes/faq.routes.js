import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  addFAQ,
  deleteFAQ,
  editFAQ,
  getAllFAQs,
  getFAQByRecordId,
} from "../controller/faq.controller.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();
router.use("*", authMiddleware(["user", "admin"]));

router.post("/faq/add", expressToHono(addFAQ));
router.post("/faq/edit", expressToHono(editFAQ));
router.post("/faq/delete", expressToHono(deleteFAQ));
router.get("/faq", expressToHono(getAllFAQs));
router.post("/faq/getedit", expressToHono(getFAQByRecordId));

export default router;
