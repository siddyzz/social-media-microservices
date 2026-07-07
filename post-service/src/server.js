import dotenv from "dotenv";
import { connect } from "mongoose";
import connectToDatabase from "./database/database.js";
dotenv.config();
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { connectToRabbitMQ } from "./utils/rabbitmq.js";
import { info, warn, error } from "./utils/logger.js";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";
import redisStore from "rate-limit-redis";
import Redis from "ioredis";
import errorHandler from "./middleware/errorHandler.js";
import { PostRouter } from "./routes/post-routes.js";
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
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10, // Number of points
  duration: 60, // Per second(s)
});
app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      warn(`Rate limit exceeded for IP :${req.ip}`);
      res.status(429).json({ message: "Too many requests" });
    });
});
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    warn(`Sensitive endpoint rate limit exceeded for IP :${req.ip}`);
    res
      .status(429)
      .json({ message: "Too many requests to sensitive endpoint" });
  },
  store: new redisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }), // we need to do this for the store to work with ioredis
});
// apply this sensitive endpointsLimiter to all routes that are sensitive

//routes -> pass reddis clients
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  PostRouter,
);
app.use(errorHandler);

// Server Starting and RabbitMQ Connection
async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      info(`Post service running on port ${PORT}`);
    });
  } catch (error) {
    error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});
