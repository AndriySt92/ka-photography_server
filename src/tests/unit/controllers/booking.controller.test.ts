import { Request, Response } from "express";

import { HTTP_STATUS } from "../../../constants";
import bookingController from "../../../controllers/booking.controller";
import BookingService from "../../../services/booking.service";

jest.mock("../../../services/booking.service");
const MockBookingService = BookingService as jest.Mocked<typeof BookingService>;

describe("Booking Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));

    mockRequest = {
      body: {},
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
  });

  describe("createBooking", () => {
    it("should create booking successfully", async () => {
      mockRequest.body = {
        name: "Joe Doe",
        contact: "+380501234567",
        sessionType: "individual",
      };

      MockBookingService.createBooking.mockResolvedValue(true);

      await bookingController.createBooking(mockRequest as Request, mockResponse as Response);

      expect(MockBookingService.createBooking).toHaveBeenCalledWith({
        name: "Joe Doe",
        contact: "+380501234567",
        sessionType: "individual",
      });

      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.CREATED);

      expect(mockJson).toHaveBeenCalledWith({
        status: "success",
        message: "Запит на фотосесію успішно надіслано. Ми зв'яжемося з вами найближчим часом!",
      });
    });

    it("should throw CustomError when service returns false", async () => {
      mockRequest.body = {
        name: "Joe Doe",
        contact: "+380501234567",
        sessionType: "individual",
      };

      MockBookingService.createBooking.mockResolvedValue(false);

      await expect(
        bookingController.createBooking(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow("Сталася помилка. Будь ласка, спробуйте ще раз");
    });

    it("should handle optional fields", async () => {
      mockRequest.body = {
        name: "Joe Doe",
        contact: "@instagram_user",
        sessionType: "love-story",
        comment: "Some comment",
        sessionDate: "2024-12-25",
      };

      MockBookingService.createBooking.mockResolvedValue(true);

      await bookingController.createBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.CREATED);

      expect(MockBookingService.createBooking).toHaveBeenCalledWith({
        name: "Joe Doe",
        contact: "@instagram_user",
        sessionType: "love-story",
        comment: "Some comment",
        sessionDate: "2024-12-25",
      });
    });
  });
});
