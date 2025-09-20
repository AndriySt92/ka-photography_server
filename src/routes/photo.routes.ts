import express from "express";

import PhotoController from "../controllers/photo.controller";
import upload from "../middlewares/upload.middleware";
import { ctrlWrapper } from "../utils";

const router = express.Router();

router.get("/", ctrlWrapper(PhotoController.getPhotosByCategory));
router.post("/", upload.array("photoFiles", 10), ctrlWrapper(PhotoController.addPhoto));
router.delete("/:id", ctrlWrapper(PhotoController.deletePhoto));

export default router;
