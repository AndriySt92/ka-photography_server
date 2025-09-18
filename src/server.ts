import dotenv from "dotenv";
import http from "http";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
