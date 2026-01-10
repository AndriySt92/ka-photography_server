import { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../../constants";
import { validateBooking } from "../../middlewares/validateContactForm.middleware";
import CustomError from "../../utils/customError";

describe("validateBooking Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it("should call next() for valid booking data with all fields", () => {
    mockRequest.body = {
      name: "Doe joe",
      contact: "+380501234567",
      sessionType: "individual",
      comment: "Хотів би дізнатися деталі зйомки",
      sessionDate: "2024-12-25 15:00",
    };

    validateBooking(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(); // No arguments means no error
  });

  it("should call next() for valid booking data with minimum required fields", () => {
    mockRequest.body = {
      name: "Doe",
      contact: "@instagram_user",
      sessionType: "group",
      // comment and sessionDate are optional
    };

    validateBooking(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should accept empty strings for optional fields", () => {
    mockRequest.body = {
      name: "Doe Joe",
      contact: "+380501234567",
      sessionType: "express",
      comment: "", // Empty string
      sessionDate: "", // Empty string
    };

    validateBooking(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
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
      mockNext.mockClear();

      mockRequest.body = {
        name,
        contact: "+380501234567",
        sessionType: "individual",
      };

      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  it("should throw CustomError for name that is too short", () => {
    mockRequest.body = {
      name: "І",
      contact: "+380501234567",
      sessionType: "individual",
    };

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(CustomError);

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(
      expect.objectContaining({
        message: "Ім'я має містити щонайменше 2 символи",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should throw CustomError for name that is too long", () => {
    const longName = "І".repeat(71); // 71 characters, max is 70
    mockRequest.body = {
      name: longName,
      contact: "+380501234567",
      sessionType: "individual",
    };

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(CustomError);

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(
      expect.objectContaining({
        message: "Ім'я не може перевищувати 70 символів",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should throw CustomError for name with invalid characters", () => {
    const invalidNames = ["John123", "Іван!", "Anna@Smith", "Test_User"];

    invalidNames.forEach((name) => {
      mockNext.mockClear();

      mockRequest.body = {
        name,
        contact: "+380501234567",
        sessionType: "individual",
      };

      expect(() => {
        validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(CustomError);

      expect(() => {
        validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(
        expect.objectContaining({
          message: expect.stringContaining("Ім'я може містити лише літери"),
          status: HTTP_STATUS.BAD_REQUEST,
        }),
      );

      expect(mockNext).not.toHaveBeenCalled();
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
      mockNext.mockClear();

      mockRequest.body = {
        name: "Іван Іваненко",
        contact: phone,
        sessionType: "individual",
      };

      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
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
      mockNext.mockClear();

      mockRequest.body = {
        name: "Іван Іваненко",
        contact,
        sessionType: "individual",
      };

      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  it("should throw CustomError for invalid contact format", () => {
    const invalidContacts = [
      "12", // Too short (2 chars)
      "abc", // Not phone or Instagram format
      "email@example.com", // Not Instagram (has @ in the middle)
      "+38050", // Too short for phone
      "38050123", // Too short for phone
      "050123", // Too short for phone
      "+123456789012", // Not Ukrainian
      "username@", // Instagram can't end with @
      "@.com", // Invalid Instagram characters
      "@a b", // Space in Instagram
    ];

    invalidContacts.forEach((contact) => {
      mockNext.mockClear();

      mockRequest.body = {
        name: "Іван Іваненко",
        contact,
        sessionType: "individual",
      };

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  it("should accept all valid session types", () => {
    const sessionTypes = ["individual", "group", "express", "love-story"];

    sessionTypes.forEach((sessionType) => {
      mockNext.mockClear();

      mockRequest.body = {
        name: "Іван Іваненко",
        contact: "+380501234567",
        sessionType,
      };

      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  it("should throw CustomError for invalid session type", () => {
    mockRequest.body = {
      name: "Іван Іваненко",
      contact: "+380501234567",
      sessionType: "invalid-type",
    };

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(CustomError);
    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(
      expect.objectContaining({
        message: "Тип фотосесії має бути одним з: individual, group, express, love-story",
        status: 400,
      }),
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should throw CustomError for comment exceeding max length", () => {
    const longComment = "a".repeat(501); // 501 characters, max is 500
    mockRequest.body = {
      name: "Іван Іваненко",
      contact: "+380501234567",
      sessionType: "individual",
      comment: longComment,
    };

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(CustomError);

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(
      expect.objectContaining({
        message: "Запитання не може перевищувати 500 символів",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should throw CustomError for sessionDate exceeding max length", () => {
    const longDate = "a".repeat(101); // 101 characters, max is 100
    mockRequest.body = {
      name: "Іван Іваненко",
      contact: "+380501234567",
      sessionType: "individual",
      sessionDate: longDate,
    };

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(CustomError);

    expect(() => {
      validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
    }).toThrow(
      expect.objectContaining({
        message: "Дата не може перевищувати 100 символів",
        status: HTTP_STATUS.BAD_REQUEST,
      }),
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should throw CustomError for missing required fields", () => {
    const testCases = [
      { body: { contact: "+380501234567", sessionType: "individual" } },
      { body: { name: "Іван Іваненко", sessionType: "individual" } },
      { body: { name: "Іван Іваненко", contact: "+380501234567" } },
    ];

    testCases.forEach(({ body }) => {
      mockNext.mockClear();

      mockRequest.body = body;

      expect(() => {
        validateBooking(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(CustomError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  it("should trim whitespace from string fields", () => {
    mockRequest.body = {
      name: "  Іван Іваненко  ",
      contact: "  +380501234567  ",
      sessionType: "individual",
      comment: "  Some comment with spaces  ",
      sessionDate: "  2024-12-25  ",
    };

    validateBooking(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
