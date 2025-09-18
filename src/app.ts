import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import connectDB from "./config/connectDb";

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

// Database connection
connectDB();

export default app;
