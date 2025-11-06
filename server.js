import "./polyfills.js";

import dotenv from "dotenv";
import app from "./app.js";

export default {
  async fetch(request, env, ctx) {
    try {
      if (env && env.MONGODB_ATLAS_API_KEY && env.MONGODB_ATLAS_API_URL) {
        try {
          const { initMongoDBAtlasAPI } = await import(
            "./config/mongodb-atlas-api.js"
          );
          initMongoDBAtlasAPI(
            env.MONGODB_ATLAS_API_KEY,
            env.MONGODB_ATLAS_API_URL,
            env.MONGODB_ATLAS_DATA_SOURCE || "Cluster0",
            env.MONGODB_ATLAS_DATABASE || "ecommerce"
          );
        } catch (error) {
          console.error("Failed to initialize MongoDB Atlas API:", error);
        }
      }

      const response = await app.fetch(request, env);
      return response;
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

const isWorker =
  typeof globalThis !== "undefined" &&
  (globalThis.constructor?.name === "ServiceWorkerGlobalScope" ||
    (typeof globalThis.navigator === "undefined" &&
      typeof globalThis.require === "undefined" &&
      typeof __dirname === "undefined" &&
      typeof __filename === "undefined"));

if (!isWorker && typeof process !== "undefined" && process.env) {
  Promise.all([
    import("socket.io").then((m) => m.Server),
    import("./config/db.js").then((m) => m.default),
    import("./routes/auth.routes.js").then((m) => m.messages),
    import("node:http").then((m) => {
      if (typeof m.createServer === "function") {
        return m.createServer;
      }
      throw new Error("createServer not available - likely in Workers");
    }),
  ])
    .then(([Server, connectDB, messages, createServer]) => {
      dotenv.config();

      connectDB();

      // Create server with Hono app using @hono/node-server
      // We need to create the server manually to attach Socket.IO
      const server = createServer(async (req, res) => {
        try {
          // Convert Node.js request to Web API Request for Hono
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host || 'localhost:5000';
          const url = `${protocol}://${host}${req.url}`;
          
          // Read request body
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : null;
          
          // Create Headers object
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
              value.forEach(v => headers.append(key, String(v)));
            } else if (value !== undefined && value !== null) {
              headers.set(key, String(value));
            }
          }
          
          // Create Web API Request
          const request = new Request(url, {
            method: req.method || 'GET',
            headers: headers,
            body: bodyBuffer ? new Uint8Array(bodyBuffer) : null,
          });

          // Call Hono app with the Request
          const response = await app.fetch(request, null);
          
          // Write response headers
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          res.statusCode = response.status;

          // Write response body
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
          origin: "*",
          methods: ["GET", "POST"],
        },
      });

      io.on("connection", (socket) => {
        console.log("A user connected: " + socket.id);

        socket.emit("message-history", messages);

        socket.on("message", (data) => {
          const message = { id: socket.id, text: data, time: new Date() };
          messages.push(message);
          socket.emit("message", message);
        });

        socket.on("disconnect", () => {
          console.log("User disconnected: " + socket.id);
        });
      });

      const PORT = process.env.PORT || 5000;
      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      if (
        error.message &&
        !error.message.includes("createServer not available")
      ) {
        console.error("Failed to start Node.js server:", error);
      }
    });
}
