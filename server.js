import "./polyfills.js";
import dotenv from "dotenv";
import app from "./app.js";

export default {
  async fetch(request, env, ctx) {
    try {
      // 🔑 Make environment variables globally available
      Object.assign(globalThis, env);

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
  dotenv.config();
  const { Server } = await import("socket.io");
  const { createServer } = await import("node:http");

  const server = createServer(async (req, res) => {
    try {
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:5000";
      const url = `${protocol}://${host}${req.url}`;
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = chunks.length ? Buffer.concat(chunks) : null;
      const headers = new Headers(Object.entries(req.headers));
      const request = new Request(url, {
        method: req.method || "GET",
        headers,
        body: body ? new Uint8Array(body) : null,
      });
      const response = await app.fetch(request, null);
      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      console.error("Server error:", e);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
