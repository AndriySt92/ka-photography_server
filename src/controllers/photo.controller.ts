import { Request, Response } from "express";

import PhotoService from "../services/photo.service";
import { CustomError } from "../utils";

const addPhoto = async (req: Request, res: Response): Promise<void> => {
  const raw: string = req.body.categories;
  const photos = req.files as Express.Multer.File[];

  if (!photos || photos.length === 0) {
    throw new CustomError("Принаймні одне фото обов'язкове", 400);
  }

  const categories = JSON.parse(raw);

  if (!Array.isArray(categories) || categories.length === 0) {
    throw new CustomError("Категорії обов'язкові", 400);
  }

  await PhotoService.addPhoto(categories, photos);

  res.status(201).json({ status: "success", message: "Фото додано успішно" });
};

const getPhotos = async (req: Request, res: Response): Promise<void> => {
  const category = (req.query.category as string) || undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;

  const { photos, pagination } = await PhotoService.getPhotos(category, {
    page,
    limit,
  });

  res.json({
    status: "success",
    data: photos,
    pagination,
  });
};

const deletePhoto = async (req: Request, res: Response): Promise<void> => {
  const photoId = req.params.id;

  await PhotoService.deletePhoto(photoId);

  res.json({ status: "success", message: "Фото видалено успішно" });
};

export default {
  addPhoto,
  getPhotos,
  deletePhoto,
};
