import { Hono } from "hono";
import {
  login,
  verifyOTP,
  adminLogin,
  resendOTP,
} from "../controller/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = new Hono();

router.post("/login", login);

router.post("/resend-otp", resendOTP);

router.post("/verify-otp", verifyOTP);

router.post("/admin-login", adminLogin);

router.get("/demo", authMiddleware(["admin"]), (c) => {
  return c.text("SBV Backend is running 🚀");
});

const messages = [];

router.get("/getmessage", (c) => {
  return c.json(messages);
});

// POST a new message (optional, for REST API)
router.post("/sendmessage", async (c) => {
  const { text, id } = await c.req.json();
  if (!text) return c.json({ error: "Message text is required" }, 400);

  const message = { id: id || "anonymous", text, time: new Date() };
  messages.push(message);
  return c.json(message, 201);
});

export default router;
export { messages };
