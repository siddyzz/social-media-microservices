import dotenv from "dotenv";
import { connect } from "mongoose";
dotenv.config();
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { info, warn, error } from "./utils/logger.js";
import connectToDatabase from "./database/database.js";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";
import { SearchRouter } from "./routes/search-routes.js";
import handlers from "./eventHandlers/media-event-handlers.js";
const { handlePostCreated, handlePostDeleted } = handlers;
import redisStore from "rate-limit-redis";
import Redis from "ioredis";
import errorHandler from "./middlewares/errorHandler.js";
import { connectToRabbitMQ, consumeFromRabbitMQ } from "./utils/rabbitmq.js";
const redisClient = new Redis(process.env.REDIS_URL);
const app = express();
const PORT = process.env.PORT || 3001;
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
//error handler
app.use("/api/search", SearchRouter);

app.use(errorHandler);
async function startServer() {
  try {
    await connectToRabbitMQ();

    //consume the events / subscribe to the events
    await consumeFromRabbitMQ("post.created", handlePostCreated);
    await consumeFromRabbitMQ("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      info(`Search service is running on port: ${PORT}`);
    });
  } catch (e) {
    error(e, "Failed to start search service");
    process.exit(1);
  }
}

startServer();
//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});
