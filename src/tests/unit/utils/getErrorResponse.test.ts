import mongoose from "mongoose";

import { HTTP_STATUS } from "../../../constants";
import getErrorResponse from "../../../utils/getErrorResponse";

// Mock the global console.error to keep test output clean
const mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});

describe("getErrorResponse", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe("Mongoose ValidationError", () => {
    it("should handle ValidationError with multiple errors", () => {
      const validationError = new mongoose.Error.ValidationError();

      validationError.errors = {
        name: {
          message: "Name is required",
          name: "ValidatorError",
          properties: { message: "Name is required", type: "required" },
          kind: "required",
          path: "name",
          value: undefined,
        },
        email: {
          message: "Invalid email format",
          name: "ValidatorError",
          properties: { message: "Invalid email format", type: "regexp" },
          kind: "regexp",
          path: "email",
          value: "invalid-email",
        },
      };

      const result = getErrorResponse(validationError);

      expect(result).toEqual({
        status: HTTP_STATUS.BAD_REQUEST,
        message: "Invalid input data: Name is required. Invalid email format",
      });
    });

    it("should handle ValidationError with single error", () => {
      const validationError = new mongoose.Error.ValidationError();

      validationError.errors = {
        password: {
          message: "Password must be at least 6 characters",
          name: "ValidatorError",
          properties: { message: "Password must be at least 6 characters" },
          kind: "minlength",
          path: "password",
          value: "123",
        },
      };

      const result = getErrorResponse(validationError);

      expect(result).toEqual({
        status: HTTP_STATUS.BAD_REQUEST,
        message: "Invalid input data: Password must be at least 6 characters",
      });
    });

    it("should handle ValidationError with empty errors object", () => {
      const validationError = new mongoose.Error.ValidationError();
      validationError.errors = {};

      const result = getErrorResponse(validationError);

      expect(result).toEqual({
        status: HTTP_STATUS.BAD_REQUEST,
        message: "Invalid input data: ",
      });
    });
  });

  describe("Mongoose CastError", () => {
    it("should handle CastError for invalid ObjectId", () => {
      const castError = new mongoose.Error.CastError("ObjectId", "invalid-id", "_id");

      const result = getErrorResponse(castError);

      expect(result).toEqual({
        status: HTTP_STATUS.BAD_REQUEST,
        message: "Invalid resource ID format",
      });
    });

    it("should handle CastError for other types", () => {
      const castError = new mongoose.Error.CastError("Number", "not-a-number", "age");

      const result = getErrorResponse(castError);

      expect(result).toEqual({
        status: HTTP_STATUS.BAD_REQUEST,
        message: "Invalid resource ID format",
      });
    });
  });

  describe("SyntaxError (JSON parsing)", () => {
    it("should handle SyntaxError with body property", () => {
      const syntaxError = new SyntaxError("Unexpected token");

      // Add body property to simulate Express JSON parsing error
      const syntaxErrorWithBody = syntaxError as SyntaxError & { body?: unknown };
      syntaxErrorWithBody.body = { json: "invalid" };

      const result = getErrorResponse(syntaxError);

      expect(result).toEqual({
        status: HTTP_STATUS.BAD_REQUEST,
        message: "Invalid JSON payload",
      });
    });

    it("should NOT treat regular SyntaxError as JSON error", () => {
      const syntaxError = new SyntaxError("Unexpected identifier");

      const result = getErrorResponse(syntaxError);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "Unexpected identifier",
      });
    });
  });

  describe("Generic Error", () => {
    it("should handle standard Error objects", () => {
      const error = new Error("Database connection failed");

      const result = getErrorResponse(error);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "Database connection failed",
      });
    });

    it("should handle custom Error with custom properties using intersection type", () => {
      const error = new Error("Custom error") as Error & {
        code: string;
        statusCode: number;
      };

      error.code = "CUSTOM_CODE";
      error.statusCode = HTTP_STATUS.BAD_REQUEST;

      const result = getErrorResponse(error);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "Custom error",
      });
    });

    it("should handle Error with empty message", () => {
      const error = new Error("");

      const result = getErrorResponse(error);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "",
      });
    });
  });

  describe("String errors", () => {
    it("should handle string error messages", () => {
      const error = "User not found";

      const result = getErrorResponse(error);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "User not found",
      });
    });

    it("should handle empty string error", () => {
      const error = "";

      const result = getErrorResponse(error);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "",
      });
    });

    it("should handle string with special characters", () => {
      const error = "Error: Invalid input <script>alert('xss')</script>";

      const result = getErrorResponse(error);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "Error: Invalid input <script>alert('xss')</script>",
      });
    });
  });

  describe("Unknown/Other errors", () => {
    it("should handle null", () => {
      const result = getErrorResponse(null);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "An error occurred",
      });
    });

    it("should handle undefined", () => {
      const result = getErrorResponse(undefined);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "An error occurred",
      });
    });

    it("should handle numbers", () => {
      const result = getErrorResponse(HTTP_STATUS.NOT_FOUND);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "An error occurred",
      });
    });

    it("should handle arrays", () => {
      const result = getErrorResponse(["error1", "error2"]);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "An error occurred",
      });
    });

    it("should handle objects without Error prototype", () => {
      const error = { message: "Custom object error", code: HTTP_STATUS.INTERNAL_SERVER_ERROR };

      const result = getErrorResponse(error);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "An error occurred",
      });
    });
  });

  describe("createErrorResponse function", () => {
    it("should use default message and status", () => {
      const unknownError = {};

      const result = getErrorResponse(unknownError);

      expect(result).toEqual({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: "An error occurred",
      });
    });

    it("should allow custom message and status", () => {
      const result = getErrorResponse(new Error("Test error"));

      expect(result.message).toBe("Test error");
      expect(result.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  describe("HTTP status codes", () => {
    it("should return BAD_REQUEST for ValidationError", () => {
      const validationError = new mongoose.Error.ValidationError();

      const validatorError = new mongoose.Error.ValidatorError({
        message: "Required",
        path: "field",
        value: undefined,
      });

      const validationErrorWithErrors = validationError as mongoose.Error.ValidationError & {
        errors: Record<string, mongoose.Error.ValidatorError>;
      };

      validationErrorWithErrors.errors = {
        field: validatorError,
      };

      const result = getErrorResponse(validationErrorWithErrors);

      expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return BAD_REQUEST for CastError", () => {
      const castError = new mongoose.Error.CastError("ObjectId", "invalid", "_id");
      const result = getErrorResponse(castError);

      expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return BAD_REQUEST for JSON SyntaxError", () => {
      const syntaxError = new SyntaxError("Unexpected token");

      const syntaxErrorWithBody = syntaxError as SyntaxError & { body?: unknown };
      syntaxErrorWithBody.body = {};

      const result = getErrorResponse(syntaxError);

      expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return INTERNAL_SERVER_ERROR for generic errors", () => {
      const result = getErrorResponse(new Error("Generic error"));
      expect(result.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it("should return INTERNAL_SERVER_ERROR for strings", () => {
      const result = getErrorResponse("Error string");
      expect(result.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  describe("Typo in default message", () => {
    it("should use the exact default message with typo", () => {
      const result = getErrorResponse(null);

      expect(result.message).toBe("An error occurred");
    });
  });
});
