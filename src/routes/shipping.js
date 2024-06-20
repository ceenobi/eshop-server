import express from "express";
import * as ShippingController from "../controllers/shipping.js";
import { verifyToken, Roles } from "../middleware/verifyAuth.js";
import { genLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post(
  "/:merchantCode/create",
  verifyToken(Roles.Seller),
  genLimiter,
  ShippingController.createShippingFee
);

router.get("/:merchantCode/all", ShippingController.getAllShippingFee);

router.get("/:merchantCode/get/:shippingId", ShippingController.getShipping);
router.get(
  "/:merchantCode/get/:state/amount",
  ShippingController.getShippingAmount
);

router.patch(
  "/:merchantCode/update/:shippingId",
  verifyToken(Roles.Seller),
  ShippingController.updateShipping
);

router.delete(
  "/:merchantId/delete/:shippingId",
  verifyToken(Roles.Seller),
  ShippingController.deleteShipping
);

export default router;
