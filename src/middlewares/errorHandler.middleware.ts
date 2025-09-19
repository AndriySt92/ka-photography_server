import { ErrorRequestHandler } from "express";

import { getErrorResponse } from "../utils";
import CustomError from "../utils/customError";

interface IErrorResponse {
  status: number;
  message: string;
  stack?: string;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  if (err instanceof CustomError) {
    res.status(err.status || 500).json({
      status: "error",
      message: err.message,
      ...(err.stack && { stack: err.stack }),
    });
    return;
  }

  const errorResponse: IErrorResponse = getErrorResponse(err);

  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(errorResponse.status).json({
    status: "error",
    message: errorResponse.message,
    ...(errorResponse.stack && { stack: errorResponse.stack }),
  });
};

export default errorHandler;
