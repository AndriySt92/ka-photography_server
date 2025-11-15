import express from "express";

import PhotoController from "../controllers/photo.controller";
import { auth } from "../middlewares";
import upload from "../middlewares/upload.middleware";
import { ctrlWrapper } from "../utils";

const router = express.Router();

router.get("/", ctrlWrapper(PhotoController.getPhotos));
router.post("/", auth, upload.array("photoFiles", 10), ctrlWrapper(PhotoController.addPhoto));
router.delete("/:id", auth, ctrlWrapper(PhotoController.deletePhoto));

export default router;
