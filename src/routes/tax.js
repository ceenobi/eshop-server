import express from "express";
import * as TaxController from "../controllers/tax.js";
import { verifyToken, Roles } from "../middleware/verifyAuth.js";
import { genLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post(
  "/:merchantCode/create",
  verifyToken(Roles.Seller),
  genLimiter,
  TaxController.createTax
);
router.get("/:merchantCode/all", TaxController.getAllTax);
router.get("/:merchantCode/get/:taxId", TaxController.getTax);
router.get("/:merchantCode/get/:state/rate", TaxController.getTaxRate);
router.patch(
  "/:merchantCode/update/:taxId",
  verifyToken(Roles.Seller),
  TaxController.updateTax
);
router.delete(
  "/:merchantCode/delete/:taxId",
  verifyToken(Roles.Seller),
  TaxController.deleteTax
);

export default router;
