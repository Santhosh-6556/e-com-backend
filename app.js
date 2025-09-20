import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import nodeRoutes from "./routes/node.routes.js";
import productRoutes from "./routes/product.router.js";
import categoryRoutes from "./routes/category.routes.js";
import brandRoutes from "./routes/band.routes.js"; // check spelling: band.routes.js?

import bodyParser from "body-parser";
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" })); // allows large JSON payloads
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/admin", nodeRoutes);
app.use("/admin/products", productRoutes);
app.use("/admin", categoryRoutes);
app.use("/admin", brandRoutes);

app.get("/ping", (req, res) => {
  res.send("pong");
});

export default app;
