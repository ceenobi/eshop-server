import express from "express";
import * as CustomerController from "../controllers/customer.js";
import { verifyToken, Roles } from "../middleware/verifyAuth.js";

const router = express.Router();

router.get("/:merchantCode/all", CustomerController.getAllCustomers);
router.get("/:merchantCode/get/:username", CustomerController.getACustomer);
router.delete(
  "/:merchantCode/delete/:username",
  verifyToken(Roles.Seller),
  CustomerController.deleteACustomer
);

export default router;
