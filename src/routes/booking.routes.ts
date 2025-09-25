import express from "express";

import BookingController from "../controllers/booking.controller";
import { validateContactForm } from "../middlewares";
import { ctrlWrapper, rateLimiter } from "../utils";

const router = express.Router();

router.post("/", rateLimiter, validateContactForm, ctrlWrapper(BookingController.createBooking));

export default router;
