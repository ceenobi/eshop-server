import dotenv from "dotenv";
import express, { json } from "express";
import createHttpError, { isHttpError } from "http-errors";
import cors from "cors";
import morgan from "morgan";
import fileupload from "express-fileupload";
import { v2 as cloudinary } from "cloudinary";
import authRoutes from "./routes/auth.js";
import merchantRoutes from "./routes/merchant.js";
import taxRoutes from "./routes/tax.js";
import discountRoutes from "./routes/discount.js";
import categoryRoutes from "./routes/category.js";
import productRoutes from "./routes/product.js";
import shippingRoutes from "./routes/shipping.js";
import OrderRoutes from "./routes/orders.js";
import CustomerRoutes from "./routes/customer.js";
import env from "./utils/validateEnv.js";

dotenv.config();
const app = express();
cloudinary.config({
  cloud_name: env.CLOUDINARY_NAME,
  api_key: env.CLOUDINARY_APIKEY,
  api_secret: env.CLOUDINARY_SECRET,
});

app.use(morgan("dev"));
app.use(cors());
app.disable("x-powered-by");
app.use(
  fileupload({
    useTempFiles: true,
  })
);
app.use(json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: false }));

app.get("/", (req, res) => {
  res.send("Hello world");
});

//api routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/merchant", merchantRoutes);
app.use("/api/v1/tax", taxRoutes);
app.use("/api/v1/discount", discountRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/shipping", shippingRoutes);
app.use("/api/v1/order", OrderRoutes);
app.use("/api/v1/customer", CustomerRoutes);

app.use((req, res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

app.use((error, req, res, next) => {
  console.error(error);
  let errorMessage = "An unknown error has occurred";
  let statusCode = 500;
  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }
  res.status(statusCode).json({ error: errorMessage });
});

export default app;
