import express from "express";
import * as AuthController from "../controllers/auth.js";
import { loginValidator, signUpValidator } from "../utils/userValidators.js";
import { verifyToken, Roles } from "../middleware/verifyAuth.js";
import { genLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", signUpValidator, genLimiter, AuthController.signUp);
router.post("/login", loginValidator, genLimiter, AuthController.signIn);
router.post("/refresh-token", AuthController.refreshAccessToken);
router.get("/", verifyToken(Roles.All), AuthController.authenticateUser);
router.patch(
  "/update-account",
  verifyToken(Roles.All),
  AuthController.updateUserAccount
);
router.delete(
  "/delete-account",
  verifyToken(Roles.All),
  AuthController.deleteUserAccount
);
router.post("/forgot-password", genLimiter, AuthController.forgotPassword);
router.patch(
  "/reset-password/:userId/:token",
  genLimiter,
  AuthController.resetUserPassword
);

export default router;
