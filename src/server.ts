import http from "http";

import app from "./app";
import { connectDB } from "./config";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, async () => {
  console.log(`Server is listening on port ${PORT}`);

  // Database connection
  await connectDB();
});
