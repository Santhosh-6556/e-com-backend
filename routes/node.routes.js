import { Hono } from "hono";
import {
  addNode,
  deleteNode,
  editNode,
  getParentNodes,
  getNodeByRecordId,
  getNodeMenuData,
  getAllNodes,
} from "../controller/node.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { expressToHono } from "../utils/hono-adapter.js";

const router = new Hono();

router.post(
  "/interface/edit",
  authMiddleware(["admin"]),
  expressToHono(addNode)
);
router.get(
  "/interface/getMenu",
  authMiddleware(["admin"]),
  expressToHono(getNodeMenuData)
);
router.get(
  "/interface/get",
  authMiddleware(["admin"]),
  expressToHono(getParentNodes)
);
router.get("/interface", authMiddleware(["admin"]), expressToHono(getAllNodes));
router.post(
  "/interface/getedits",
  authMiddleware(["admin"]),
  expressToHono(editNode)
);
router.post(
  "/interface/delete",
  authMiddleware(["admin"]),
  expressToHono(deleteNode)
);
router.post(
  "/interface/getedit",
  authMiddleware(["admin"]),
  expressToHono(getNodeByRecordId)
);

export default router;
