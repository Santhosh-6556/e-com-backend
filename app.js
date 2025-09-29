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
import banner from "./routes/banner.routes.js"

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: "50mb" })); 
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Routes
app.use("/api/auth", authRoutes);
app.use("/admin", nodeRoutes);
app.use("/admin", productRoutes);
app.use("/admin", categoryRoutes);
app.use("/admin", brandRoutes);
app.use("/admin", wishlist);
app.use("/admin", banner);

app.get("/ping", (req, res) => {
  res.send("pong");
});

export default app;
