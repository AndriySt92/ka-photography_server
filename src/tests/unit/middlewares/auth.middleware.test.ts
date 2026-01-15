import jwt from "jsonwebtoken";

import auth from "../../../middlewares/auth.middleware";
import Admin from "../../../models/admin.model";
import CustomError from "../../../utils/customError";
import { user } from "../../fixtures/user";
import { setupMiddlewareTest } from "../../utils/expressMock";

jest.mock("../../../models/admin.model");
jest.mock("jsonwebtoken");

describe("Auth Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET_KEY = "test-secret-key";
  });

  describe("Successful authentication", () => {
    it("should set req.user when valid token is provided", async () => {
      const mockUser = user;

      const mockToken = "valid.jwt.token";
      const mockDecoded = { userId: mockUser._id };

      const { req, res, next } = setupMiddlewareTest({
        reqCookies: { auth_token: "valid.jwt.token" },
      });

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      (Admin.findById as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUser),
      }));

      await auth(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET_KEY);
      expect(Admin.findById).toHaveBeenCalledWith(mockUser._id);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("Authentication failures", () => {
    it("should throw CustomError when no token is provided", async () => {
      const { req, res, next } = setupMiddlewareTest();

      await auth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));

      const errorCall = next.mock.calls[0][0];
      expect(errorCall).toBeInstanceOf(CustomError);
    });

    it("should throw CustomError when token is invalid", async () => {
      const { req, res, next } = setupMiddlewareTest({
        reqCookies: { auth_token: "invalid.token" },
      });

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid token");
      });

      await auth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(jwt.JsonWebTokenError);
    });

    it("should throw CustomError when token has no userId", async () => {
      const mockDecoded = {}; // No userId

      const { req, res, next } = setupMiddlewareTest({
        reqCookies: { auth_token: "token.without.userId" },
      });
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await auth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should throw CustomError when user is not found", async () => {
      const mockDecoded = { userId: "nonexistentid" };

      const { req, res, next } = setupMiddlewareTest({
        reqCookies: { auth_token: "valid.token" },
      });

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      (Admin.findById as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      await auth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should handle database errors", async () => {
      const mockDecoded = { userId: "userid" };

      const { req, res, next } = setupMiddlewareTest({
        reqCookies: { auth_token: "valid.token" },
      });

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      (Admin.findById as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      }));

      await auth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Token verification", () => {
    it("should verify token with correct secret key", async () => {
      const mockToken = "valid.jwt.token";
      const mockDecoded = { userId: "userid" };
      const mockUser = user;

      const { req, res, next } = setupMiddlewareTest({
        reqCookies: { auth_token: "valid.jwt.token" },
      });
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      (Admin.findById as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUser),
      }));

      await auth(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET_KEY);
    });

    it("should handle expired token", async () => {
      const { req, res, next } = setupMiddlewareTest({
        reqCookies: { auth_token: "expired.token" },
      });

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError("jwt expired", new Date());
      });

      await auth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(jwt.TokenExpiredError);
    });
  });
});
