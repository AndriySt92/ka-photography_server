import BookingService from "../../services/booking.service";
import { sendEmail } from "../../utils";

jest.mock("../../utils", () => ({
  sendEmail: jest.fn(),
  CustomError: jest.fn(),
}));

describe("Booking Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = "test@example.com";
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
  });

  const bookingData = {
    name: "Joe Doe",
    contact: "+380501234567",
    sessionType: "individual" as const,
    comment: "Some comment",
    sessionDate: "2024-12-25 15:00",
  };

  it("should call sendEmail with correct parameters", async () => {
    (sendEmail as jest.Mock).mockResolvedValue(true);

    const result = await BookingService.createBooking(bookingData);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith({
      to: "test@example.com",
      subject: "Новий запит на фотосесію від Joe Doe",
      html: expect.stringContaining("Joe Doe"),
    });

    expect(result).toBe(true);
  });

  it("should handle missing optional fields", async () => {
    (sendEmail as jest.Mock).mockResolvedValue(true);
    const dataWithoutOptional = {
      name: "Joe Doe",
      contact: "+380501234567",
      sessionType: "individual" as const,
    };

    const result = await BookingService.createBooking(dataWithoutOptional);

    expect(result).toBe(true);
    const html = (sendEmail as jest.Mock).mock.calls[0][0].html;
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
      // Reset for each iteration
      (sendEmail as jest.Mock).mockClear();
      (sendEmail as jest.Mock).mockResolvedValue(true);

      const data = {
        ...bookingData,
        sessionType: input as typeof bookingData.sessionType,
      };

      await BookingService.createBooking(data);

      const html = (sendEmail as jest.Mock).mock.calls[0][0].html;
      expect(html).toContain(expected);
    }
  });
});
