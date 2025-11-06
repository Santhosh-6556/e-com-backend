import "./polyfills.js";

import dotenv from "dotenv";
import app from "./app.js";

export default {
  async fetch(request, env, ctx) {
    try {
      if (env && env.DB) {
        try {
          const { setD1 } = await import("./config/d1.js");
          setD1(env.DB);
        } catch (error) {
          console.error("Failed to initialize D1:", error);
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
    import("./routes/auth.routes.js").then((m) => m.messages),
    import("node:http").then((m) => {
      if (typeof m.createServer === "function") {
        return m.createServer;
      }
      throw new Error("createServer not available - likely in Workers");
    }),
  ])
    .then(([Server, messages, createServer]) => {
      dotenv.config();

      console.log(
        "⚠️  Note: D1 database is only available in Cloudflare Workers"
      );
      console.log("   Use 'wrangler dev' for local development with D1");

      const server = createServer(async (req, res) => {
        try {
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const host = req.headers.host || "localhost:5000";
          const url = `${protocol}://${host}${req.url}`;

          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : null;

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
              value.forEach((v) => headers.append(key, String(v)));
            } else if (value !== undefined && value !== null) {
              headers.set(key, String(value));
            }
          }

          const request = new Request(url, {
            method: req.method || "GET",
            headers: headers,
            body: bodyBuffer ? new Uint8Array(bodyBuffer) : null,
          });

          const response = await app.fetch(request, null);

          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          res.statusCode = response.status;

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
