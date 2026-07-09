import { info, warn, error } from "../utils/logger.js";
const authenticateRequest = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    warn("Access denied - attempted without User ID ");
    return res.status(401).json({
      success: false,
      message:
        "Access denied - Authentication is required ! Please login to continue",
    });
  }
  req.user = { userId };
  next();
};
export { authenticateRequest };
