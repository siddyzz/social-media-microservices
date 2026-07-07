import { error } from "../../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
export default errorHandler;
