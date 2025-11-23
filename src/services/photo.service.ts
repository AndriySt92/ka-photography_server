import cloudinary from "../config/cloudinary";
import Photos from "../models/photo.model";
import { CustomError, uploadImage } from "../utils";

const addPhoto = async (categories: string[], photoFiles: Express.Multer.File[]) => {
  await Promise.all(
    photoFiles.map(async (photoFile) => {
      const photoUrl = await uploadImage(photoFile);
      await Photos.create({ categories, photoUrl });
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

  // Delete image from Cloudinary
  const publicId = `photos/${photo.photoUrl.split("/").pop()?.split(".")[0]}`;

  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }

  await photo.deleteOne();
};

export default {
  addPhoto,
  getPhotos,
  deletePhoto,
};
