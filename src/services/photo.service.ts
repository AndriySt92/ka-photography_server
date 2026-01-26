import mongoose from "mongoose";

import cloudinary from "../config/cloudinary";
import { HTTP_STATUS } from "../constants";
import { PhotoUploadDto } from "../dto";
import Photos from "../models/photo.model";
import { createPaginationResponse, CustomError } from "../utils";

const addPhoto = async (categories: string[], photos: PhotoUploadDto[]) => {
  await Promise.all(
    photos.map(async (photo: { url: string; publicId: string }) => {
      await Photos.create({
        categories,
        photoUrl: photo.url,
        publicId: photo.publicId,
      });
    }),
  );
};

const getPhotos = async (category, pageOptions: { page: number; limit: number; skip: number }) => {
  const { limit, page, skip } = pageOptions;

  const query = category && category !== "" ? { categories: { $in: [category] } } : {};

  const [photos, total] = await Promise.all([
    Photos.find(query).sort("-createdAt").skip(skip).limit(limit),
    Photos.countDocuments(query),
  ]);

  return {
    photos,
    pagination: createPaginationResponse(total, page, limit),
  };
};

const deletePhoto = async (photoId: string) => {
  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    throw new CustomError("Фото не знайдено", HTTP_STATUS.NOT_FOUND);
  }

  const photo = await Photos.findById(photoId);

  if (!photo) throw new CustomError("Фото не знайдено", HTTP_STATUS.NOT_FOUND);

  if (photo.publicId) {
    await cloudinary.uploader.destroy(photo.publicId);
  }

  await photo.deleteOne();
};

export default {
  addPhoto,
  getPhotos,
  deletePhoto,
};
