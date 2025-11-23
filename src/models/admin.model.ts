import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { Admin } from "../types/admin.interface";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: [3, "Ім'я повинно містити щонайменше 3 символи"],
    maxlength: [100, "Ім'я повинно містити не більше 100 символів"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Електронна пошта обов'язкова"],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Невірний формат електронної пошти"],
  },
  password: {
    type: String,
    required: [true, "Пароль обов'язковий"],
    minlength: [6, "Пароль повинен містити щонайменше 6 символів"],
  },
  role: {
    type: String,
    enum: ["admin"],
    default: "admin",
  },
});

adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

adminSchema.methods.isValidPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const Admin = mongoose.model<Admin>("Admin", adminSchema);

export default Admin;
