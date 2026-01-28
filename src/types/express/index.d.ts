import { Admin } from "../admin.interface";

declare global {
  namespace Express {
    interface Request {
      user?: Admin;
    }
  }
}
