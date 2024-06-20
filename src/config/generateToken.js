import jwt from "jsonwebtoken";
import env from "../utils/validateEnv.js";

export const generateToken = (id, role) => {
  return jwt.sign({ id, role }, env.JWT_ACCESS_TOKEN, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
};

export const generateRefreshToken = (id, role) => {
  return jwt.sign({ id, role }, env.JWT_REFRESH_TOKEN, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
};
