import express from "express";
import {
  login,
  verifyOTP,
  adminLogin,
  resendOTP,
} from "../controller/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);

router.post("/resend-otp", resendOTP);

router.post("/verify-otp", verifyOTP);

router.post("/admin-login", adminLogin);

router.get("/demo", authMiddleware(["admin"]), (req, res) => {
  res.send("SBV Backend is running 🚀");
});

const messages = [];

router.get("/getmessage", (req, res) => {
  res.json(messages);
});

// POST a new message (optional, for REST API)
router.post("/sendmessage", (req, res) => {
  const { text, id } = req.body;
  if (!text) return res.status(400).json({ error: "Message text is required" });

  const message = { id: id || "anonymous", text, time: new Date() };
  messages.push(message);
  res.status(201).json(message);
});

export default router;
export { messages };
