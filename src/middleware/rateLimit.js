import { rateLimit } from "express-rate-limit";

export const genLimiter = rateLimit({
  windowMs: 10 * 10 * 1000,
  max: 5,
});

export default {
  genLimiter,
};
