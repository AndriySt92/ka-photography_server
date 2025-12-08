import { Response } from "express";
import jwt from "jsonwebtoken";

import getCookieOptions from "./getCookieOptions";

const generateTokenAndSetCookie = ({ userId, res }: { userId: string; res: Response }): void => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY as string, {
    expiresIn: "15d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("auth_token", token, getCookieOptions(isProduction, 15 * 24 * 60 * 60 * 1000));
};

export default generateTokenAndSetCookie;
