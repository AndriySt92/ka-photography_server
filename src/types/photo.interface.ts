import { Document } from "mongoose";

export interface IPhoto extends Document {
  categories: string[];
  photoUrl: string;
  publicId: string;
  createdAt: Date;
  updatedAt: Date;
}
