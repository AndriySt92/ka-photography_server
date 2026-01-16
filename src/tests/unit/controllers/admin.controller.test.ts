import { HTTP_STATUS } from "../../../constants";
import adminController from "../../../controllers/admin.controller";
import AdminService from "../../../services/admin.service";
import { Admin } from "../../../types";
import { user } from "../../fixtures/user";
import { setupControllerTest } from "../../utils/expressMock";

jest.mock("../../../services/admin.service");
const MockAdminService = AdminService as jest.Mocked<typeof AdminService>;

describe("Admin Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should call AdminService.login, set cookie and respond with user", async () => {
      const loginData = {
        email: "admin@example.com",
        password: "secret",
      };

      const { req, res } = setupControllerTest({
        reqBody: loginData,
        addCookieMethod: true,
      });

      const userWithToken = {
        ...user,
        token: "jwt-token-123",
      };

      MockAdminService.login.mockResolvedValue(
        userWithToken as unknown as Admin & { _id: string; token: string },
      );

      await adminController.login(req, res);

      expect(MockAdminService.login).toHaveBeenCalledWith(loginData, res);

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: userWithToken,
      });
    });

    it("should handle login error and not set cookie", async () => {
      const loginData = {
        email: "wrong@example.com",
        password: "wrong",
      };

      const { req, res } = setupControllerTest({
        reqBody: loginData,
      });

      const error = new Error("Invalid credentials");
      MockAdminService.login.mockRejectedValue(error);

      await expect(adminController.login(req, res)).rejects.toThrow("Invalid credentials");

      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should clear auth_token cookie and return success message", () => {
      const { req, res } = setupControllerTest();

      adminController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        "auth_token",
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
        }),
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Вихід успішний",
      });
    });
  });

  describe("current", () => {
    it("should return current user from request", async () => {
      const { req, res } = setupControllerTest({
        reqUser: user,
      });

      await adminController.current(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: user,
      });
    });

    it("should handle missing user gracefully", async () => {
      const { req, res } = setupControllerTest({
        reqUser: null,
      });

      await expect(adminController.login(req, res)).rejects.toThrow("Invalid credentials");

      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
