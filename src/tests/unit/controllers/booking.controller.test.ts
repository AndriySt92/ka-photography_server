import { HTTP_STATUS } from "../../../constants";
import bookingController from "../../../controllers/booking.controller";
import BookingService from "../../../services/booking.service";
import { completeBookingData, requiredBookingData } from "../../fixtures";
import { setupControllerTest } from "../../utils";

jest.mock("../../../services/booking.service");
const MockBookingService = BookingService as jest.Mocked<typeof BookingService>;

describe("Booking Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBooking", () => {
    it("should create booking successfully and return 201 status", async () => {
      const { req, res } = setupControllerTest({
        reqBody: requiredBookingData,
      });

      MockBookingService.createBooking.mockResolvedValue(true);

      await bookingController.createBooking(req, res);

      expect(MockBookingService.createBooking).toHaveBeenCalledWith(requiredBookingData);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Запит на фотосесію успішно надіслано. Ми зв'яжемося з вами найближчим часом!",
      });
    });

    it("should throw CustomError when service returns false", async () => {
      const { req, res } = setupControllerTest({
        reqBody: requiredBookingData,
      });

      MockBookingService.createBooking.mockResolvedValue(false);

      await expect(bookingController.createBooking(req, res)).rejects.toThrow(
        "Сталася помилка. Будь ласка, спробуйте ще раз",
      );
    });

    it("should handle optional fields", async () => {
      const { req, res } = setupControllerTest({
        reqBody: completeBookingData,
      });

      MockBookingService.createBooking.mockResolvedValue(true);

      await bookingController.createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);

      expect(MockBookingService.createBooking).toHaveBeenCalledWith(completeBookingData);
    });
  });
});
