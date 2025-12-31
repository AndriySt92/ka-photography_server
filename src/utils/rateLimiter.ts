import rateLimit from "express-rate-limit";

import { HTTP_STATUS } from "../constants";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      status: "error",
      message: "Too many requests, please try again later",
    });
  },
});

export default rateLimiter;
