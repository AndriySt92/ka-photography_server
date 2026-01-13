import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import auth from "../../../middlewares/auth.middleware";
import Admin from "../../../models/admin.model";
import { Admin as AdminType } from "../../../types";
import CustomError from "../../../utils/customError";

jest.mock("../../../models/admin.model");
jest.mock("jsonwebtoken");

interface TestRequest extends Request {
  user: AdminType;
  cookies: {
    [key: string]: string | undefined;
  };
}

describe("Auth Middleware", () => {
  let mockRequest: Partial<TestRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      cookies: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();

    process.env.JWT_SECRET_KEY = "test-secret-key";
  });

  describe("Successful authentication", () => {
    it("should set req.user when valid token is provided", async () => {
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "admin@example.com",
        role: "admin",
        username: "Admin User",
        password: "hashedpassword",
      };

      const mockToken = "valid.jwt.token";
      const mockDecoded = { userId: mockUser._id };

      mockRequest.cookies = { auth_token: mockToken };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      (Admin.findById as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUser),
      }));

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET_KEY);
      expect(Admin.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe("Authentication failures", () => {
    it("should throw CustomError when no token is provided", async () => {
      mockRequest.cookies = {};

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));

      const errorCall = mockNext.mock.calls[0][0];
      expect(errorCall).toBeInstanceOf(CustomError);
    });

    it("should throw CustomError when token is invalid", async () => {
      mockRequest.cookies = { auth_token: "invalid.token" };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid token");
      });

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(jwt.JsonWebTokenError);
    });

    it("should throw CustomError when token has no userId", async () => {
      const mockToken = "token.without.userId";
      const mockDecoded = {}; // No userId

      mockRequest.cookies = { auth_token: mockToken };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should throw CustomError when user is not found", async () => {
      const mockToken = "valid.token";
      const mockDecoded = { userId: "nonexistentid" };

      mockRequest.cookies = { auth_token: mockToken };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      (Admin.findById as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should handle database errors", async () => {
      const mockToken = "valid.token";
      const mockDecoded = { userId: "userid" };

      mockRequest.cookies = { auth_token: mockToken };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      (Admin.findById as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      }));

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Token verification", () => {
    it("should verify token with correct secret key", async () => {
      const mockToken = "valid.jwt.token";
      const mockDecoded = { userId: "userid" };
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "admin@example.com",
        role: "admin",
        username: "Admin User",
        password: "hashedpassword",
      };

      mockRequest.cookies = { auth_token: mockToken };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      (Admin.findById as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUser),
      }));

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET_KEY);
    });

    it("should handle expired token", async () => {
      const mockToken = "expired.token";

      mockRequest.cookies = { auth_token: mockToken };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError("jwt expired", new Date());
      });

      await auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(jwt.TokenExpiredError);
    });
  });
});
