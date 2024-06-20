import express from "express";
import * as DiscountController from "../controllers/discount.js";
import { verifyToken, Roles } from "../middleware/verifyAuth.js";

const router = express.Router();

router.post(
  "/:merchantCode/create",
  verifyToken(Roles.Seller),
  DiscountController.createDiscount
);

router.patch(
  "/:merchantCode/update/:discountId",
  verifyToken(Roles.Seller),
  DiscountController.updateDiscount
);

router.delete(
  "/:merchantCode/delete/:discountId",
  verifyToken(Roles.Seller),
  DiscountController.deleteDiscount
);

router.get("/:merchantCode/get/:discountId", DiscountController.getADiscount);
router.get(
  "/:merchantCode/all",
  DiscountController.getAllDiscounts
);

router.post(
  "/:merchantCode/validate/:quantity/:subTotal",
  verifyToken(Roles.All),
  DiscountController.validateDiscountCode
);

export default router;
