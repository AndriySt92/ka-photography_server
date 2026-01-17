import bcrypt from "bcryptjs";
import { Response } from "express";

import { LoginData } from "../../../dto";
import Admin from "../../../models/admin.model";
import AdminService from "../../../services/admin.service";
import generateTokenAndSetCookie from "../../../utils/generateTokenAndSetCookie";
import { user } from "../../fixtures/user";

jest.mock("bcryptjs");
jest.mock("../../../models/admin.model");
jest.mock("../../../utils/generateTokenAndSetCookie", () => jest.fn());

const mockAdminFindOne = Admin.findOne as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockGenerateToken = generateTokenAndSetCookie as jest.Mock;

describe("Admin Service - login", () => {
  const loginData: LoginData = { email: "admin@example.com", password: "plainpassword" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw CustomError when user is not found", async () => {
    mockAdminFindOne.mockResolvedValue(null);

    const mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    await expect(AdminService.login(loginData, mockRes)).rejects.toThrow(
      "Неправильний пароль або логін",
    );

    expect(mockAdminFindOne).toHaveBeenCalledWith({
      email: loginData.email,
    });
  });

  it("should throw CustomError when password is incorrect", async () => {
    const foundUser = {
      ...user,
      toObject: () => user,
    };

    mockAdminFindOne.mockResolvedValue(foundUser);
    mockBcryptCompare.mockResolvedValue(false);

    const mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    await expect(AdminService.login(loginData, mockRes)).rejects.toThrow(
      "Неправильний пароль або логін",
    );

    expect(mockAdminFindOne).toHaveBeenCalledWith({
      email: loginData.email,
    });
    expect(mockBcryptCompare).toHaveBeenCalledWith(loginData.password, foundUser.password);
  });

  it("should throw CustomError when admin is not found", async () => {
    mockAdminFindOne.mockResolvedValue(null);

    const mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    await expect(AdminService.login(loginData, mockRes)).rejects.toThrow(
      "Неправильний пароль або логін",
    );
  });

  it("should generate token, set cookie and return user without password on successful login", async () => {
    const mockAdmin = {
      ...user,
      toObject: function () {
        const { password: _password, ...rest } = this;
        return rest;
      },
    };

    mockAdminFindOne.mockResolvedValue(mockAdmin);
    mockBcryptCompare.mockResolvedValue(true);

    const mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    const result = await AdminService.login(loginData, mockRes);

    expect(mockAdminFindOne).toHaveBeenCalledWith({ email: loginData.email });
    expect(mockBcryptCompare).toHaveBeenCalledWith(loginData.password, mockAdmin.password);
    expect(mockGenerateToken).toHaveBeenCalledWith({ userId: mockAdmin._id, res: mockRes });

    expect(result).not.toHaveProperty("password");
    expect(result._id).toBe(mockAdmin._id);
    expect(result.email).toBe(mockAdmin.email);
  });
});
