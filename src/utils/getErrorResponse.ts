import mongoose from "mongoose";

import { HTTP_STATUS } from "../constants";

const createErrorResponse = (
  message = "An error ogcured",
  status = HTTP_STATUS.INTERNAL_SERVER_ERROR,
) => ({ status, message });

const getErrorResponse = (error: unknown) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((val) => val.message);
    const errorMessages = errors.join(". ");
    return createErrorResponse(`Invalid input data: ${errorMessages}`, HTTP_STATUS.BAD_REQUEST);
  }

  if (error instanceof mongoose.Error.CastError) {
    return createErrorResponse("Invalid resource ID format", HTTP_STATUS.BAD_REQUEST);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return createErrorResponse("Invalid JSON payload", HTTP_STATUS.BAD_REQUEST);
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
