import { Application } from "express";
import { OutgoingHttpHeaders } from "http2";
import jwt from "jsonwebtoken";
import request from "supertest";

import Admin from "../../../src/models/admin.model";
import { Admin as AdminType } from "../../types";
import { createTestAdmin as createTestAdminFixture } from "../fixtures";

export const createTestAdmin = async (overrides = {}): Promise<AdminType> => {
  const admin = new Admin({ ...createTestAdminFixture(overrides), ...overrides });
  return await admin.save();
};

export const getCookiesFromHeader = (headers: OutgoingHttpHeaders): string[] => {
  const cookies = headers["set-cookie"];
  return Array.isArray(cookies) ? cookies : [];
};

export const loginAdminAndGetCookies = async (
  app: Application,
  email?: string,
  password?: string,
): Promise<string[]> => {
  const adminData = createTestAdminFixture();
  const emailToUse = email || adminData.email;
  const passwordToUse = password || adminData.password;

  const loginResponse = await request(app)
    .post("/api/admin/login")
    .send({ email: emailToUse, password: passwordToUse });

  return getCookiesFromHeader(loginResponse.headers);
};

export const generateExpiredToken = (): string => {
  const secret = process.env.JWT_SECRET_KEY || "test-secret-key";

  return jwt.sign({ userId: "test-user-id" }, secret, { expiresIn: "-1h" });
};
