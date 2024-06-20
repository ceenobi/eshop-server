import express from "express";
import * as CategoryController from "../controllers/category.js";
import { verifyToken, Roles } from "../middleware/verifyAuth.js";

const router = express.Router();

router.post(
  "/:merchantCode/create",
  verifyToken(Roles.Seller),
  CategoryController.createCategory
);

router.get("/:merchantCode/all", CategoryController.getAllCategories);
router.get("/:merchantCode/get/:categoryId", CategoryController.getACategory);

router.patch(
  "/:merchantCode/update/:categoryId",
  verifyToken(Roles.Seller),
  CategoryController.updateCategory
);

router.delete(
  "/:merchantCode/delete/:categoryId",
  verifyToken(Roles.Seller),
  CategoryController.deleteCategory
);

export default router;
