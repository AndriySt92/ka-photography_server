import request from "supertest";

import app from "../../app";
import { HTTP_STATUS } from "../../constants";
import BookingService from "../../services/booking.service";
import { requiredBookingData } from "../fixtures/bookingData";

jest.mock("../../utils/sendEmail", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../services/booking.service", () => ({
  createBooking: jest.fn().mockResolvedValue(true),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/bookings", () => {
  it("should create a booking successfully", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send(requiredBookingData)
      .expect(HTTP_STATUS.CREATED);

    expect(response.body).toEqual({
      status: "success",
      message: "Запит на фотосесію успішно надіслано. Ми зв'яжемося з вами найближчим часом!",
    });
  });

  it("should return 400 for invalid data, invalid contact", async () => {
    const invalidPayload = {
      ...requiredBookingData,
      contact: "+38050123456", // Invalid contact
    };

    const response = await request(app)
      .post("/api/bookings")
      .send(invalidPayload)
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain(
      "Будь ласка, введіть коректний номер телефону (+380XXXXXXXXX) або Instagram (@username)",
    );
  });

  it("should return 400 for invalid data, invalid name", async () => {
    const invalidPayload = {
      ...requiredBookingData,
      name: "I", // Too short
    };

    const response = await request(app)
      .post("/api/bookings")
      .send(invalidPayload)
      .expect(HTTP_STATUS.BAD_REQUEST);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Ім'я має містити щонайменше 2 символи");
  });

  it("should return 500 when service fails", async () => {
    jest.mocked(BookingService.createBooking).mockResolvedValueOnce(false);

    const response = await request(app)
      .post("/api/bookings")
      .send(requiredBookingData)
      .expect(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Сталася помилка. Будь ласка, спробуйте ще раз");
  });
});
