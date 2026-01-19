import { OutgoingHttpHeaders } from "http2";
import request from "supertest";

import app from "../../../src/app";
import Admin from "../../../src/models/admin.model";
import { HTTP_STATUS } from "../../constants";
import { clearDatabase, closeDatabase, connect } from "../setup/mongodb";

const createTestAdmin = async () => {
  const admin = new Admin({
    username: "testadmin",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });

  return await admin.save();
};

const getCookiesFromHeader = (headers: OutgoingHttpHeaders): string[] => {
  const cookies = headers["set-cookie"];
  return Array.isArray(cookies) ? cookies : [];
};

describe("Admin API Integration Tests", () => {
  beforeAll(async () => {
    await connect();

    process.env.JWT_SECRET_KEY = "test-secret-key";
    process.env.NODE_ENV = "test";
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /api/admin/login", () => {
    it("should login admin successfully and return user data without password", async () => {
      await createTestAdmin();

      const loginData = {
        email: "admin@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/admin/login")
        .send(loginData)
        .expect("Content-Type", /json/)
        .expect(HTTP_STATUS.OK);

      expect(response.body).toHaveProperty("status", "success");
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("email", "admin@example.com");
      expect(response.body.data).toHaveProperty("username", "testadmin");
      expect(response.body.data).not.toHaveProperty("password");

      const cookies = getCookiesFromHeader(response.headers);
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((cookie: string) => cookie.includes("auth_token"))).toBe(true);
    });

    it("should return 400 with error message for invalid credentials", async () => {
      await createTestAdmin();

      const invalidLoginData = {
        email: "admin@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/admin/login")
        .send(invalidLoginData)
        .expect("Content-Type", /json/)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("message", "Неправильний пароль або логін");
    });

    it("should return 400 when admin does not exist", async () => {
      const nonExistentAdmin = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/admin/login")
        .send(nonExistentAdmin)
        .expect("Content-Type", /json/)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("message", "Неправильний пароль або логін");
    });

    it("should return 400 for empty request body", async () => {
      const response = await request(app)
        .post("/api/admin/login")
        .send({})
        .expect("Content-Type", /json/)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body).toHaveProperty("status", "error");
    });
  });

  describe("DELETE /api/admin/logout", () => {
    it("should logout successfully when authenticated", async () => {
      await createTestAdmin();

      const loginResponse = await request(app).post("/api/admin/login").send({
        email: "admin@example.com",
        password: "password123",
      });

      const cookies = getCookiesFromHeader(loginResponse.headers);

      const logoutResponse = await request(app)
        .delete("/api/admin/logout")
        .set("Cookie", cookies)
        .expect("Content-Type", /json/)
        .expect(HTTP_STATUS.OK);

      expect(logoutResponse.status).toBe(HTTP_STATUS.OK);
      expect(logoutResponse.body).toHaveProperty("status", "success");
      expect(logoutResponse.body).toHaveProperty("message", "Вихід успішний");
    });

    it("should return 401 when trying to logout without authentication", async () => {
      const response = await request(app)
        .delete("/api/admin/logout")
        .expect("Content-Type", /json/);

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/admin/current", () => {
    it("should return current admin data when authenticated", async () => {
      await createTestAdmin();

      const loginResponse = await request(app).post("/api/admin/login").send({
        email: "admin@example.com",
        password: "password123",
      });

      const cookies = getCookiesFromHeader(loginResponse.headers);

      const currentResponse = await request(app)
        .get("/api/admin/current")
        .set("Cookie", cookies)
        .expect("Content-Type", /json/)
        .expect(HTTP_STATUS.OK);

      expect(currentResponse.status).toBe(HTTP_STATUS.OK);
      expect(currentResponse.body).toHaveProperty("status", "success");
      expect(currentResponse.body).toHaveProperty("data");
      expect(currentResponse.body.data).toHaveProperty("email", "admin@example.com");
      expect(currentResponse.body.data).toHaveProperty("username", "testadmin");
      expect(currentResponse.body.data).not.toHaveProperty("password");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/admin/current").expect("Content-Type", /json/);

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(response.body).toHaveProperty("status", "error");
    });
  });

  describe("Session Management", () => {
    it("should maintain session across multiple requests", async () => {
      await createTestAdmin();

      const loginResponse = await request(app).post("/api/admin/login").send({
        email: "admin@example.com",
        password: "password123",
      });

      const cookies = getCookiesFromHeader(loginResponse.headers);

      const currentResponse1 = await request(app).get("/api/admin/current").set("Cookie", cookies);

      const currentResponse2 = await request(app).get("/api/admin/current").set("Cookie", cookies);

      expect(currentResponse1.status).toBe(HTTP_STATUS.OK);
      expect(currentResponse2.status).toBe(HTTP_STATUS.OK);
      expect(currentResponse1.body.data.email).toBe("admin@example.com");
      expect(currentResponse2.body.data.email).toBe("admin@example.com");
    });
  });
});
