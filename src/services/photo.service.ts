import cloudinary from "../config/cloudinary";
import { PhotoUploadDto } from "../dto";
import Photos from "../models/photo.model";
import { CustomError } from "../utils";

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

const getPhotos = async (category, pageOptions: { page: number; limit: number }) => {
  const page = pageOptions.page;
  const limit = pageOptions.limit;
  const skip = (page - 1) * limit;

  const query = category && category !== "" ? { categories: { $in: [category] } } : {};

  const [photos, total] = await Promise.all([
    Photos.find(query).sort("-createdAt").skip(skip).limit(limit),
    Photos.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    photos,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const deletePhoto = async (photoId: string) => {
  const photo = await Photos.findById(photoId);

  if (!photo) throw new CustomError("Фото не знайдено", 404);

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
