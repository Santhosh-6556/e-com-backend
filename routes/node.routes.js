import express from "express";
import {
  addNode,
  deleteNode,
  editNode,
  getAllNodes,
  getNodeByRecordId,
  getNodeMenuData,
} from "../controller/node.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/interface/edit", authMiddleware(["admin"]), addNode);
router.get(
  "/interface/getMenu",
  authMiddleware(["admin"]),
  getNodeMenuData
);
router.get("/interface/get", authMiddleware(["admin"]), getAllNodes);
router.post("/interface/getedits", authMiddleware(["admin"]), editNode);
router.delete("/interface/delete", authMiddleware(["admin"]), deleteNode);
router.post("/interface/getedit", authMiddleware(["admin"]), getNodeByRecordId);


export default router;
