// server.js (ESM version)
// Import polyfills first before any other imports
import "./polyfills.js";

import dotenv from "dotenv";
import app from "./app.js";

// Workers export - must be at top level
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

// Node.js server setup - only run in Node.js environment, not Workers
// Check if we're in a Node.js environment (not Workers)
// Workers don't have createServer, Server from socket.io, etc.
// Node.js server setup - ONLY run in actual Node.js runtime, NOT in Workers
// Workers don't have http.createServer, so this code will fail if executed in Workers
// We disable this entire block in Workers by checking for Worker-specific environment
// The simplest way: only run if we're NOT in a Worker context
// Workers always have a fetch handler, so we check if we're being called as a Worker

// Check if we're in Workers: Workers don't have __dirname, __filename, or module
// Also, Workers have a different global scope
const isWorker =
  typeof globalThis !== "undefined" &&
  (globalThis.constructor?.name === "ServiceWorkerGlobalScope" ||
    (typeof globalThis.navigator === "undefined" &&
      typeof globalThis.require === "undefined" &&
      typeof __dirname === "undefined" &&
      typeof __filename === "undefined"));

// Only run Node.js server setup if we're NOT in Workers
// This check must be strict - Workers will fail if this code runs
if (!isWorker && typeof process !== "undefined" && process.env) {
  // Dynamic imports for Node.js-only dependencies
  // Only execute if we're in Node.js (not Workers)
  Promise.all([
    import("socket.io").then((m) => m.Server),
    import("./config/db.js").then((m) => m.default),
    import("./routes/auth.routes.js").then((m) => m.messages),
    import("node:http").then((m) => {
      // Check if createServer actually exists and is a function
      if (typeof m.createServer === "function") {
        return m.createServer;
      }
      throw new Error("createServer not available - likely in Workers");
    }),
  ])
    .then(([Server, connectDB, messages, createServer]) => {
      dotenv.config();

      // Connect to MongoDB (only in Node.js)
      connectDB();

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
    })
    .catch((error) => {
      // Silently ignore errors in Workers (expected - these imports don't work in Workers)
      // Only log if we're actually in Node.js
      if (
        error.message &&
        !error.message.includes("createServer not available")
      ) {
        console.error("Failed to start Node.js server:", error);
      }
    });
}
