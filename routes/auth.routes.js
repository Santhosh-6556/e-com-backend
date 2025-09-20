import express from "express";
import { login, register } from "../controller/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/demo", authMiddleware(["admin"]), (req, res) => {
  res.send("SBV Backend is running 🚀");
});


// In-memory messages storage
const messages = [];

// GET all messages
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
