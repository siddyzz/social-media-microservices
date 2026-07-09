import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import redisStore from "rate-limit-redis";
import { info, warn, error } from "./utils/logger.js";
import proxy from "express-http-proxy";
import errorHandler from "./middleware/errorHandler.js";
import validToken from "./middleware/authmiddleware.js";
dotenv.config();

const PORT = process.env.PORT || 3001;
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
const POST_SERVICE_URL = process.env.POST_SERVICE_URL;
const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL;
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL;
const REDIS_URL = process.env.REDIS_URL;

if (!IDENTITY_SERVICE_URL) {
  throw new Error(
    "IDENTITY_SERVICE_URL must be set in environment variables or .env file",
  );
}
if (!POST_SERVICE_URL) {
  throw new Error(
    "POST_SERVICE_URL must be set in environment variables or .env file",
  );
}
if (!MEDIA_SERVICE_URL) {
  throw new Error(
    "MEDIA_SERVICE_URL must be set in environment variables or .env file",
  );
}
if (!SEARCH_SERVICE_URL) {
  throw new Error(
    "SEARCH_SERVICE_URL must be set in environment variables or .env file",
  );
}

if (!REDIS_URL) {
  throw new Error(
    "REDIS_URL must be set in environment variables or .env file",
  );
}

const app = express();
const redisClient = new Redis(REDIS_URL);
app.use(cors());
app.use(helmet());
app.use(express.json());

// rate limiting api gateway to prevent abuse of sensitive endpoints, using Redis to store rate limit data
const ratelimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
app.use(ratelimit);
app.use((req, res, next) => {
  info(`Received ${req.method} request for ${req.url}`);
  info(`Request Body: ${JSON.stringify(req.body)}`);
  next();
});
const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (req, res, err) => {
    const errorMessage =
      err?.message || err?.toString() || JSON.stringify(err) || "Unknown error";
    const errorDetails = {
      message: errorMessage,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    };
    error(`Proxy error: ${errorMessage}`, errorDetails);
    res.status(502).json({
      message: "Service temporarily unavailable",
      details: errorMessage,
    });
  },
};

// setting up proxy routes for identity service
app.use(
  "/v1/auth",
  proxy(IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      info(`Response received from identity service :${proxyRes.statusCode}`);
      return proxyResData;
    },
  }),
);
// setting up proxy routes for post service
app.use(
  "/v1/posts",
  validToken,
  proxy(POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      if (srcReq.user && srcReq.user.userId) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      info(`Response received from Post service :${proxyRes.statusCode}`);
      return proxyResData;
    },
  }),
);
// setting up proxy routes for Media service
app.use(
  "/v1/media",
  validToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (srcReq.user?.userId) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      }

      const contentType =
        srcReq.headers["content-type"] || srcReq.headers["Content-Type"] || "";
      if (!contentType.startsWith("multipart/form-data")) {
        proxyReqOpts.headers["Content-Type"] = "application/json";
      }

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      info(`Response received from media service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
    parseReqBody: false,
  }),
);

app.use(
  "/v1/search",
  validToken,
  proxy(SEARCH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Search service: ${proxyRes.statusCode}`,
      );

      return proxyResData;
    },
  }),
);
app.use(errorHandler);
app.listen(PORT, () => {
  info(`API gateway is running on port ${PORT}`);
  info(`Identity service is configured for ${IDENTITY_SERVICE_URL}`);
  info(`Post service is configured for${POST_SERVICE_URL}`);
  info(`Media service is configured for${MEDIA_SERVICE_URL}`);
  info(`Search service is configured for${SEARCH_SERVICE_URL}`);
  info(`Redis URL is configured for ${REDIS_URL}`);
});
