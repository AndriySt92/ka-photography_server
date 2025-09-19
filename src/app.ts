import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import connectDB from "./config/connectDb";
import { errorHandler } from "./middlewares";
import { CustomError } from "./utils";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.all("*", (req, _res, next): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
});

app.use(errorHandler);

// Database connection
connectDB();

export default app;
