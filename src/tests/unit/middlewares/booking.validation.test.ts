import { HTTP_STATUS } from "../../../constants";
import { validateBooking } from "../../../middlewares/validateContactForm.middleware";
import CustomError from "../../../utils/customError";
import { completeBookingData, requiredBookingData } from "../../fixtures";
import { setupMiddlewareTest } from "../../utils";

describe("validateBooking Middleware", () => {
  beforeEach(() => {});

  it("should call next() for valid booking data with all fields", () => {
    const { req, res, next } = setupMiddlewareTest({
      reqBody: completeBookingData,
    });

    validateBooking(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(); // No arguments means no error
  });

  it("should call next() for valid booking data with minimum required fields", () => {
    const { req, res, next } = setupMiddlewareTest({
      reqBody: requiredBookingData,
    });

    validateBooking(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("should accept empty strings for optional fields", () => {
    const { req, res, next } = setupMiddlewareTest({
      reqBody: {
        ...requiredBookingData,
        comment: "", // Empty string
        sessionDate: "", // Empty string
      },
    });

    validateBooking(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("should accept Ukrainian letters and special characters in name", () => {
    // Test various valid Ukrainian names
    const validNames = [
      "Іван Іваненко",
      "Мар'яна Петренко",
      "Олексій-Микола",
      "Анна-Марія Сміт",
      "Євгеній Щербак",
      "Ґалаґан Ірина",
    ];

    validNames.forEach((name) => {
      const { req, res, next } = setupMiddlewareTest({
        reqBody: {
          ...requiredBookingData,
          name,
        },
      });

      next.mockClear();

      validateBooking(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  it("should throw CustomError for name that is too short", () => {
    const { req, res, next } = setupMiddlewareTest({
      reqBody: {
        ...requiredBookingData,
        name: "І",
      },
    });

    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(CustomError);

    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(
      expect.objectContaining({
        message: "Ім'я має містити щонайменше 2 символи",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should throw CustomError for name that is too long", () => {
    const longName = "І".repeat(71); // 71 characters, max is 70

    const { req, res, next } = setupMiddlewareTest({
      reqBody: {
        ...requiredBookingData,
        name: longName,
      },
    });

    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(CustomError);

    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(
      expect.objectContaining({
        message: "Ім'я не може перевищувати 70 символів",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should throw CustomError for name with invalid characters", () => {
    const invalidNames = ["John123", "Іван!", "Anna@Smith", "Test_User"];

    invalidNames.forEach((name) => {
      const { req, res, next } = setupMiddlewareTest({ reqBody: { ...requiredBookingData, name } });

      expect(() => {
        validateBooking(req, res, next);
      }).toThrow(CustomError);

      expect(() => {
        validateBooking(req, res, next);
      }).toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Ім'я може містити лише літери"),
          status: HTTP_STATUS.BAD_REQUEST,
        }),
      );

      expect(next).not.toHaveBeenCalled();
    });
  });

  it("should accept valid Ukrainian phone numbers", () => {
    const validPhones = [
      "+380501234567",
      "0501234567",
      "380501234567",
      "+380991234567",
      "0991234567",
      "380991234567",
    ];

    validPhones.forEach((phone) => {
      const { req, res, next } = setupMiddlewareTest({
        reqBody: { ...requiredBookingData, contact: phone },
      });

      validateBooking(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  it("should accept valid Instagram usernames", () => {
    // Test various valid Instagram formats
    const validInstagramHandles = [
      "@username",
      "username",
      "@user_name",
      "@user.name",
      "@user123",
      "@very_long_username_here",
    ];

    validInstagramHandles.forEach((contact) => {
      const { req, res, next } = setupMiddlewareTest({
        reqBody: {
          ...requiredBookingData,
          contact,
        },
      });

      validateBooking(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  it("should throw CustomError for invalid contact format", () => {
    const invalidContacts = [
      "a", // Too short for Instagram
      "email@example.com", // Not Instagram (has @ in the middle)
      "+38050", // Too short for phone
      "+123456789012", // Not Ukrainian
      "username@", // Instagram can't end with @
      "@.com", // Invalid Instagram characters (starts with dot)
      "@a b", // Space in Instagram
      "user..name", // Consecutive dots
      "user.", // Ends with dot
    ];

    invalidContacts.forEach((contact) => {
      const { req, res, next } = setupMiddlewareTest({
        reqBody: {
          ...completeBookingData,
          contact,
        },
      });

      expect(() => {
        validateBooking(req, res, next);
      }).toThrow(CustomError);

      expect(next).not.toHaveBeenCalled();
    });
  });

  it("should accept all valid session types", () => {
    const sessionTypes = ["individual", "group", "express", "love-story"];

    sessionTypes.forEach((sessionType) => {
      const { req, res, next } = setupMiddlewareTest({
        reqBody: {
          ...requiredBookingData,
          sessionType,
        },
      });

      validateBooking(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  it("should throw CustomError for invalid session type", () => {
    const { req, res, next } = setupMiddlewareTest({
      reqBody: {
        ...requiredBookingData,
        sessionType: "invalid-type",
      },
    });
    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(CustomError);
    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(
      expect.objectContaining({
        message: "Тип фотосесії має бути одним з: individual, group, express, love-story",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should throw CustomError for comment exceeding max length", () => {
    const longComment = "a".repeat(501); // 501 characters, max is 500
    const { req, res, next } = setupMiddlewareTest({
      reqBody: {
        ...requiredBookingData,
        comment: longComment,
      },
    });

    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(CustomError);

    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(
      expect.objectContaining({
        message: "Запитання не може перевищувати 500 символів",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should throw CustomError for sessionDate exceeding max length", () => {
    const longDate = "a".repeat(101); // 101 characters, max is 100
    const { req, res, next } = setupMiddlewareTest({
      reqBody: {
        ...completeBookingData,
        sessionDate: longDate,
      },
    });

    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(CustomError);

    expect(() => {
      validateBooking(req, res, next);
    }).toThrow(
      expect.objectContaining({
        message: "Дата не може перевищувати 100 символів",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should throw CustomError for missing required fields", () => {
    const testCases = [
      { body: { contact: "+380501234567", sessionType: "individual" } },
      { body: { name: "Іван Іваненко", sessionType: "individual" } },
      { body: { name: "Іван Іваненко", contact: "+380501234567" } },
    ];

    testCases.forEach(({ body }) => {
      const { req, res, next } = setupMiddlewareTest({
        reqBody: body,
      });

      expect(() => {
        validateBooking(req, res, next);
      }).toThrow(CustomError);

      expect(next).not.toHaveBeenCalled();
    });
  });

  it("should trim whitespace from string fields", () => {
    const { req, res, next } = setupMiddlewareTest({
      reqBody: {
        name: "  Іван Іваненко  ",
        contact: "  +380501234567  ",
        sessionType: "individual",
        comment: "  Some comment with spaces  ",
        sessionDate: "  2024-12-25  ",
      },
    });

    validateBooking(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
