// server.js (ESM version)
// Import polyfills first before any other imports
import "./polyfills.js";

import dotenv from "dotenv";
import app from "./app.js";
import { Server } from "socket.io"; // socket.io
import connectDB from "./config/db.js";
import { messages } from "./routes/auth.routes.js";
import { createServer } from "node:http";

dotenv.config();

if (typeof process !== "undefined" && process.env) {
  connectDB();
}

export default {
  async fetch(request, env, ctx) {
    try {
      const response = await app.fetch(request, env);
      return response;
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

if (
  typeof process !== "undefined" &&
  process.env &&
  typeof createServer !== "undefined"
) {
  const server = createServer(async (req, res) => {
    try {
      const response = await app.fetch(req);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.statusCode = response.status;

      // Handle different response types
      if (response.body) {
        const buffer = await response.arrayBuffer();
        res.end(Buffer.from(buffer));
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Server error:", error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*", // allow all origins for testing
      methods: ["GET", "POST"],
    },
  });

  // Handle Socket.IO connections
  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    // Send all previous messages to newly connected client
    socket.emit("message-history", messages);

    // Listen for new message
    socket.on("message", (data) => {
      const message = { id: socket.id, text: data, time: new Date() };
      messages.push(message); // store in memory
      // io.emit("message", message);  // broadcast to all clients
      socket.emit("message", message);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected: " + socket.id);
    });
  });

  // Start server
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
