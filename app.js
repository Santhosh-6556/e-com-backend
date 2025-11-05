import "./polyfills.js";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { existsSync } from "node:fs";
import path from "node:path";
import authRoutes from "./routes/auth.routes.js";
import nodeRoutes from "./routes/node.routes.js";
import productRoutes from "./routes/product.router.js";
import categoryRoutes from "./routes/category.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import wishlist from "./routes/wishlist.routes.js";
import banner from "./routes/banner.routes.js";
import tax from "./routes/tax.routes.js";
import publicRoutes from "./routes/public.routes.js";
import cart from "./routes/cart.routes.js";
import user from "./routes/user.routes.js";
import faq from "./routes/faq.routes.js";
import order from "./routes/order.routes.js";

const app = new Hono();

app.use("*", async (c, next) => {
  if (c.env) {
    c.set("env", c.env);
  }
  await next();
});

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

try {
  if (
    typeof process !== "undefined" &&
    process.cwd &&
    typeof process.cwd === "function"
  ) {
    const uploadsPath = path.join(process.cwd(), "uploads");
    if (
      existsSync &&
      typeof existsSync === "function" &&
      existsSync(uploadsPath)
    ) {
      app.use(
        "/uploads/*",
        serveStatic({
          root: uploadsPath,
        })
      );
    }
  }
} catch (error) {}

app.route("/api/auth", authRoutes);
app.route("/admin", nodeRoutes);
app.route("/admin", productRoutes);
app.route("/admin", categoryRoutes);
app.route("/admin", brandRoutes);
app.route("/admin", wishlist);
app.route("/admin", banner);
app.route("/admin", tax);
app.route("/admin", faq);
app.route("/api", publicRoutes);
app.route("/admin", cart);
app.route("/admin", user);
app.route("/admin", order);

app.get("/ping", (c) => {
  return c.text("pong");
});

export default app;
