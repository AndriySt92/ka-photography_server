import mongoose from "mongoose";

const createErrorResponse = (message = "An error ogcured", status = 500) => ({ status, message });

const getErrorResponse = (error: unknown) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((val) => val.message);
    const errorMessages = errors.join(". ");
    return createErrorResponse(`Invalid input data: ${errorMessages}`, 400);
  }

  if (error instanceof mongoose.Error.CastError) {
    return createErrorResponse("Invalid resource ID format", 400);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return createErrorResponse("Invalid JSON payload", 400);
  }

  if (error instanceof Error) {
    return createErrorResponse(error.message);
  }

  if (typeof error === "string") {
    return createErrorResponse(error);
  }

  return createErrorResponse();
};

export default getErrorResponse;
