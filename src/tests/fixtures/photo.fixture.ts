import mongoose from "mongoose";

import { AddPhotoRequestDto } from "../../dto";
import { PhotoCategory } from "../../types";
import { IPhoto } from "../../types/photo.interface";

export interface PhotoDocumentFixture extends mongoose.Document, IPhoto {
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

export interface PaginationFixture {
  total: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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
  overrides: Partial<PhotoDocumentFixture> & { _id?: string | mongoose.Types.ObjectId } = {},
): PhotoDocumentFixture =>
  ({
    _id: new mongoose.Types.ObjectId(),
    categories: [categories[0]],
    photoUrl: "https://res.cloudinary.com/test-cloud/image/upload/test.jpg",
    publicId: "test-public-id",
    ...overrides,
  }) as PhotoDocumentFixture;

export const createPaginationFixture = (
  overrides: Partial<PaginationFixture> = {},
): PaginationFixture => ({
  total: 1,
  totalPages: 1,
  currentPage: 1,
  itemsPerPage: 12,
  hasNextPage: false,
  hasPrevPage: false,
  ...overrides,
});
