import jwt from "jsonwebtoken";
import { warn } from "../utils/logger.js";

const validToken = (req, res, next) => {
  const authHeader =
    req.headers &&
    (req.headers["authorization"] || req.headers["Authorization"]);
  if (!authHeader) {
    warn("Access attempt without valid token");
    return res
      .status(401)
      .json({ message: "Authentication required", success: false });
  }

  const parts = authHeader.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) {
    warn("Access attempt without valid token");
    return res
      .status(401)
      .json({ message: "Authentication required", success: false });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET); // decoded info to check if user is valid or not
    req.user = user;
    next();
  } catch (err) {
    warn("Invalid token");
    return res.status(401).json({ message: "Invalid token", success: false });
  }
};
export default validToken;
