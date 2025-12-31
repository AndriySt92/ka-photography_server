import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { HTTP_STATUS } from "../constants";
import Admin from "../models/admin.model";
import { Admin as AdminType, DecodedToken } from "../types";
import { CustomError } from "../utils";

interface AuthenticatedRequest extends Request {
  user: AdminType;
}

const auth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies["auth_token"];

    if (!token) throw new CustomError("Unauthorized - No Token Provided", HTTP_STATUS.UNAUTHORIZED);

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as DecodedToken;

    if (!decoded.userId)
      throw new CustomError("Unauthorized - Invalid Token", HTTP_STATUS.UNAUTHORIZED);
    const user = await Admin.findById(decoded.userId).select("-password");
    if (!user) throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND);

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
