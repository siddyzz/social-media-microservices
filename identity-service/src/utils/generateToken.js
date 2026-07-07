import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/refreshToken.js";

const generateToken = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      userName: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "60m" },
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Set refresh token to expire in 7 days
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });
  return { accessToken, refreshToken };
};
export default generateToken;
