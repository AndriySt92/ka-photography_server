import { Request, Response } from "express";

import BookingService from "../services/booking.service";
import { CustomError } from "../utils";

const createBooking = async (req: Request, res: Response) => {
  const { name, contact, sessionType, comment, sessionDate } = req.body;

  const success = await BookingService.createBooking({
    name,
    contact,
    sessionType,
    comment,
    sessionDate,
  });

  if (!success) {
    throw new CustomError("Сталася помилка. Будь ласка, спробуйте ще раз", 500);
  }

  res.json({
    status: "success",
    message: "Запит на фотосесію успішно надіслано. Ми зв'яжемося з вами найближчим часом!",
  });
};

export default {
  createBooking,
};
