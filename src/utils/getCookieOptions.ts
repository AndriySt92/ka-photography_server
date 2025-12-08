import { CookieOptions } from "express";

const getCookieOptions = (isProduction: boolean, maxAge?: number) => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  if (maxAge !== undefined) {
    options.maxAge = maxAge;
  }

  if (isProduction && process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

export default getCookieOptions;
