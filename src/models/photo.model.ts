import mongoose from "mongoose";

import { PhotoCategory } from "../types";

const photoCategoryValues = Object.values(PhotoCategory);

const photoSchema = new mongoose.Schema(
  {
    categories: [{ type: String, enum: photoCategoryValues, required: true }],
    photoUrl: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Photo", photoSchema);
