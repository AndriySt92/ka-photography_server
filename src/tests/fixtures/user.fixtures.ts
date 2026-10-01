import mongoose from "mongoose";

import { Admin } from "../../types";

export interface TestAdmin extends Admin {
  password?: string;
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
