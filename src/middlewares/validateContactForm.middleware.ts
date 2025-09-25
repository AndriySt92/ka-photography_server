import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { CustomError } from "../utils";

// Validation constants
const NAME_MIN = 2;
const NAME_MAX = 70;
const CONTACT_MIN = 3;
const CONTACT_MAX = 100;
const COMMENT_MAX = 500;

// Contact validation patterns
const UA_PHONE_REGEX = /^(?:\+?380|0)\d{9}$/;
const INSTAGRAM_REGEX = /^@?[A-Za-z0-9_](?:[A-Za-z0-9_.]{0,28}[A-Za-z0-9_])?$/;

// Photo session types
const SESSION_TYPES = ["individual", "group", "express", "love-story"] as const;

const bookingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_MIN, `Ім'я має містити щонайменше ${NAME_MIN} символи`)
    .max(NAME_MAX, `Ім'я не може перевищувати ${NAME_MAX} символів`)
    .regex(/^[a-zA-Zа-яА-ЯІіЇїЄєҐґ\s'-]+$/, {
      message: "Ім'я може містити лише літери, пробіли, апострофи та дефіси",
    }),

  contact: z
    .string()
    .trim()
    .min(CONTACT_MIN, `Контакт має містити щонайменше ${CONTACT_MIN} символи`)
    .max(CONTACT_MAX, `Контакт не може перевищувати ${CONTACT_MAX} символів`)
    .refine(
      (contact) => {
        // Check if it's a Phone or Instagram format
        return UA_PHONE_REGEX.test(contact) || INSTAGRAM_REGEX.test(contact);
      },
      {
        message:
          "Будь ласка, введіть коректний номер телефону (+380XXXXXXXXX) або Instagram (@username)",
      },
    ),

  sessionType: z.enum(SESSION_TYPES, {
    errorMap: () => ({ message: `Тип фотосесії має бути одним з: ${SESSION_TYPES.join(", ")}` }),
  }),

  comment: z
    .string()
    .trim()
    .max(COMMENT_MAX, `Запитання не може перевищувати ${COMMENT_MAX} символів`)
    .optional()
    .or(z.literal("")), // Allow empty string

  sessionDate: z
    .string()
    .trim()
    .max(100, "Дата не може перевищувати 100 символів")
    .optional()
    .or(z.literal("")), // Allow empty string
});

export const validateBooking = (req: Request, _res: Response, next: NextFunction) => {
  try {
    bookingSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errorMessages = err.errors.map((e) => e.message).join(". ");
      throw new CustomError(errorMessages, 400);
    }
    throw err;
  }
};

export default validateBooking;
