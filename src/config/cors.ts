import { CorsOptions } from "cors";

const getCorsOptions = (): CorsOptions => {
  let allowedOrigins: string[];

  try {
    allowedOrigins = process.env.ALLOWED_ORIGINS ? JSON.parse(process.env.ALLOWED_ORIGINS) : [];
  } catch {
    allowedOrigins = [];
  }

  return {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-App-Version",
      "X-Platform",
      "X-Device-ID",
      "Accept",
    ],
    maxAge: 86400, // 24 hours
    exposedHeaders: ["Set-Cookie", "Date", "ETag"], // for safari
  };
};

export default getCorsOptions;
