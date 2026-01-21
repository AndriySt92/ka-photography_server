import mongoose from "mongoose";

import { AddPhotoRequestDto } from "../../dto";
import { PhotoCategory } from "../../types";

export interface PhotoDocumentFixture {
  _id: mongoose.Types.ObjectId;
  categories: string[];
  photoUrl: string;
  publicId: string;
}

export interface PhotoUploadFixture {
  categories: string[];
  photos: Array<{
    url: string;
    publicId: string;
  }>;
}

export const categories: string[] = Object.values(PhotoCategory);

export const createPhotoUploadRequest = (
  overrides: Partial<AddPhotoRequestDto> = {},
): AddPhotoRequestDto => ({
  categories: [categories[0]],
  photos: [
    {
      url: "https://res.cloudinary.com/test-cloud/image/upload/test.jpg",
      publicId: "test",
    },
  ],
  ...overrides,
});

export const createPhotoDocument = (
  overrides: Partial<PhotoDocumentFixture> = {},
): PhotoDocumentFixture => ({
  _id: new mongoose.Types.ObjectId(),
  categories: [categories[0]],
  photoUrl: "https://res.cloudinary.com/test-cloud/image/upload/test.jpg",
  publicId: "test-public-id",
  ...overrides,
});
