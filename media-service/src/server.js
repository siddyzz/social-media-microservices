import "dotenv/config";
import { connect } from "mongoose";
import connectToDatabase from "./database/database.js";
import { connectToRabbitMQ, consumeFromRabbitMQ } from "./utils/rabbitmq.js";
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { info, warn, error } from "./utils/logger.js";
import errorHandler from "./middlewares/middleware/errorHandler.js";
import { mediaRouter } from "./routes/media-routes.js";
import handlePostDeleted from "./eventHandlers/media-event-handlers.js";
const app = express();
const PORT = process.env.PORT || 3003;
connectToDatabase();

//middleware
app.use(cors());
app.use(helmet());
app.use(json());
app.use((req, res, next) => {
  info(`Received ${req.method} request for ${req.url}`);
  info(`Request Body: ${JSON.stringify(req.body)}`);
  next();
});

//routes -> pass reddis clients
app.use("/api/media", mediaRouter);
app.use(errorHandler);

async function startServer() {
  try {
    //consume
    info("Server is Starting");
    await consumeFromRabbitMQ("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      info(`Media service running on port ${PORT}`);
    });
  } catch (err) {
    error("Failed to connect to server", err);
    process.exit(1);
  }
}

startServer();

//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});
