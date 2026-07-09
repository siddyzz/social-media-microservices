import { error } from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  const errorMessage = err?.message || JSON.stringify(err) || "Unknown error";
  const errorStack = err?.stack || "";
  error(`${errorMessage} ${errorStack}`);
  res.status(err?.status || 500).json({
    success: false,
    message: errorMessage,
  });
};
export default errorHandler;
