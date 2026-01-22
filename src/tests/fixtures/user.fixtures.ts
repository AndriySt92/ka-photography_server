import mongoose from "mongoose";

export interface TestAdmin {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: "admin" | "user";
  username: string;
  password: string;
}

export const createTestAdmin = (overrides: Partial<TestAdmin> = {}): TestAdmin => ({
  _id: new mongoose.Types.ObjectId(),
  email: "admin@example.com",
  role: "admin",
  username: "Test Admin",
  password: "password123",
  ...overrides,
});

export const adminCredentials = {
  email: "admin@example.com",
  password: "password123",
};
