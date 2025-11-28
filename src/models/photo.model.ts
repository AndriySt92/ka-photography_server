import mongoose from "mongoose";

import { PhotoCategory } from "../types";
import { IPhoto } from "../types/photo.interface";

const photoCategoryValues = Object.values(PhotoCategory);

const photoSchema = new mongoose.Schema<IPhoto>(
  {
    categories: [{ type: String, enum: photoCategoryValues, required: true }],
    photoUrl: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Photo", photoSchema);
