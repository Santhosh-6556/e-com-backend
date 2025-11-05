import { Hono } from "hono";
import {
  addCategory,
  editCategory,
  deleteCategory,
  getAllCategories,
  getCategoryByRecordId,
  getCategory,
  getAdminSubcategories,
  getAdminCategories,
} from "../controller/category.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.post(
  "/category/add",
  authMiddleware(["admin"]),
  expressToHono(addCategory)
);
router.post(
  "/category/edit",
  authMiddleware(["admin"]),
  expressToHono(editCategory)
);
router.post(
  "/category/delete",
  authMiddleware(["admin"]),
  expressToHono(deleteCategory)
);
router.get(
  "/category/get",
  authMiddleware(["admin", "user"]),
  expressToHono(getAllCategories)
);
router.post(
  "/category/getedit",
  authMiddleware(["admin", "user"]),
  expressToHono(getCategoryByRecordId)
);
router.get(
  "/category",
  authMiddleware(["admin", "user"]),
  expressToHono(getCategory)
);
router.get(
  "/category/get",
  authMiddleware(["admin", "user"]),
  expressToHono(getAdminCategories)
);
router.get(
  "/subcategories/get",
  authMiddleware(["admin", "user"]),
  expressToHono(getAdminSubcategories)
);

export default router;
