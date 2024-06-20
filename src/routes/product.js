import express from "express";
import * as ProductController from "../controllers/product.js";
import { verifyToken, Roles } from "../middleware/verifyAuth.js";
import { genLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post(
  "/:merchantCode/create",
  verifyToken(Roles.Seller),
  genLimiter,
  ProductController.addProduct
);
router.get("/:merchantCode/all", ProductController.getAllProducts);
router.get("/:merchantCode/get/new", ProductController.getNewProducts);
router.get(
  "/:merchantCode/get/best-seller",
  ProductController.getBestSellerProducts
);
router.get("/:merchantCode/get/:slug", ProductController.getAProduct);
router.get(
  "/:merchantCode/get/:slug/recommended",
  ProductController.getRecommendedProducts
);
router.get(
  "/:merchantCode/:category/get",
  ProductController.getProductsByCategory
);
router.get("/:merchantCode/search", ProductController.searchProducts);

router.patch(
  "/:merchantCode/update/:productId",
  verifyToken(Roles.Seller),
  ProductController.updateProduct
);

router.delete(
  "/:merchantCode/delete/:productId",
  verifyToken(Roles.Seller),
  ProductController.deleteProduct
);

export default router;
