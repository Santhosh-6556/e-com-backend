import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import nodeRoutes from "./routes/node.routes.js";
import productRoutes from "./routes/product.router.js";
import categoryRoutes from "./routes/category.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import wishlist from "./routes/wishlist.routes.js";
import path from "path";
import bodyParser from "body-parser";
import banner from "./routes/banner.routes.js";
import tax from "./routes/tax.routes.js";
import publicRoutes from "./routes/public.routes.js";
import cart from "./routes/cart.routes.js";
import user from "./routes/user.routes.js";
import faq from "./routes/faq.routes.js";
import order from "./routes/order.routes.js";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/admin", nodeRoutes);
app.use("/admin", productRoutes);
app.use("/admin", categoryRoutes);
app.use("/admin", brandRoutes);
app.use("/admin", wishlist);
app.use("/admin", banner);
app.use("/admin", tax);
app.use("/admin", faq);
app.use("/api", publicRoutes);
app.use("/admin", cart);
app.use("/admin", user);
app.use("/admin", order);

app.get("/ping", (req, res) => {
  res.send("pong");
});

export default app;
