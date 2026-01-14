import BookingService from "../../../services/booking.service";
import { SessionType } from "../../../types";
import { sendEmail } from "../../../utils";
import { completeBookingData, requiredBookingData } from "../../fixtures/bookingData";

jest.mock("../../../utils", () => ({
  sendEmail: jest.fn(),
}));

const mockedSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe("Booking Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = "test@example.com";
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
  });

  it("should send email with correct parameters", async () => {
    mockedSendEmail.mockResolvedValue(true);

    const result = await BookingService.createBooking(completeBookingData);

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);

    const emailCall = mockedSendEmail.mock.calls[0][0];
    expect(emailCall.to).toBe("test@example.com");
    expect(emailCall.subject).toBe(`Новий запит на фотосесію від ${completeBookingData.name}`);
    expect(emailCall.html).toContain(completeBookingData.name);
    expect(emailCall.html).toContain(completeBookingData.contact);
    expect(emailCall.html).toContain(completeBookingData.comment);
    expect(emailCall.html).toContain(completeBookingData.sessionDate);

    expect(result).toBe(true);
  });

  it("should handle missing optional fields gracefully", async () => {
    mockedSendEmail.mockResolvedValue(true);

    const result = await BookingService.createBooking(requiredBookingData);

    expect(result).toBe(true);

    const html = mockedSendEmail.mock.calls[0][0].html;
    expect(html).not.toContain("❓ <b>Запитання:</b>");
    expect(html).not.toContain("⏰ <b>Бажаний час:</b>");
  });

  it("should map session types to Ukrainian correctly", async () => {
    const testCases = [
      { input: "individual", expected: "Індивідуальна зйомка" },
      { input: "group", expected: "Групова зйомка" },
      { input: "express", expected: "Експрес зйомка" },
      { input: "love-story", expected: "Love Story" },
    ];

    for (const { input, expected } of testCases) {
      mockedSendEmail.mockClear();
      mockedSendEmail.mockResolvedValue(true);

      const data = {
        ...requiredBookingData,
        sessionType: input as SessionType,
      };

      await BookingService.createBooking(data);

      const html = mockedSendEmail.mock.calls[0][0].html;
      expect(html).toContain(expected);
    }
  });

  it("should handle unknown session type by using original value", async () => {
    mockedSendEmail.mockResolvedValue(true);

    const data = {
      ...requiredBookingData,
      sessionType: "unknown-type" as SessionType,
    };

    await BookingService.createBooking(data);

    const html = mockedSendEmail.mock.calls[0][0].html;
    expect(html).toContain("unknown-type");
  });

  it("should return false when email sending fails", async () => {
    mockedSendEmail.mockResolvedValue(false);

    const result = await BookingService.createBooking(completeBookingData);

    expect(result).toBe(false);
  });

  it("should handle email sending error gracefully", async () => {
    mockedSendEmail.mockRejectedValue(new Error("SMTP error"));

    await expect(BookingService.createBooking(completeBookingData)).rejects.toThrow("SMTP error");
  });

  it("should include current date in email", async () => {
    const mockDate = new Date("2024-01-15T12:00:00");
    jest.spyOn(global, "Date").mockImplementation(() => mockDate as Date);

    mockedSendEmail.mockResolvedValue(true);

    await BookingService.createBooking(completeBookingData);

    const html = mockedSendEmail.mock.calls[0][0].html;
    expect(html).toContain("15.01.2024");

    jest.restoreAllMocks();
  });
});
