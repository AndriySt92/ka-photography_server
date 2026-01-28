import mongoose from "mongoose";

export interface Admin {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: "admin";
  username: string;
}

export interface DecodedToken {
  userId: string;
}
