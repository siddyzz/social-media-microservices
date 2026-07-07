import { info, warn, error } from "../utils/logger.js";
import { validateRegistration, validateLogin } from "../utils/validation.js";
import NewUser from "../models/user.js";
import RefreshToken from "../models/refreshToken.js";
import generateToken from "../utils/generateToken.js";

const registerUser = async (req, res) => {
  info("Registering User Endpoint ");
  try {
    const { username, email, password } = req.body;
    const { error: validationError } = validateRegistration(req.body);
    if (validationError) {
      warn("Validation Error: " + validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }
    let user = await NewUser.findOne({ $or: [{ email }, { username }] });
    if (user) {
      warn(
        "User already exists with email or username: " +
          email +
          " or " +
          username,
      );
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    user = new NewUser({ username, email, password });
    await user.save();
    info("User registered successfully: " + user._id);
    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    error("Error occurred while registering user: " + err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  info("Logging end point hit ");
  try {
    const { error: validationError } = validateLogin(req.body);
    if (validationError) {
      warn("Validation Error: " + validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }
    const { username, email, password } = req.body;
    const user = await NewUser.findOne({ username });
    if (!user) {
      warn("Invalid user");
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      warn("Invalid Password");
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateToken(user);
    res.json({
      success: true,
      message: "User Logged in successfully",
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (err) {
    error("Error occurred while registering user: " + err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const refreshtoken = async (req, res) => {
  info("hitting refresh token endpoint ");
  try {
    const { Refreshtoken } = req.body;
    if (!Refreshtoken) {
      warn(" RefreshToken is missing ");
      return res
        .status(400)
        .json({ success: false, message: " RefreshToken is missing " });
    }
    const storedToken = await RefreshToken.findOne({ token: Refreshtoken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      warn(" RefreshToken is expired or Invalid ");
      return res.status(400).json({
        success: false,
        message: " RefreshToken is expired or  Invalid ",
      });
    }

    const user = await NewUser.findById(storedToken.user);
    if (!user) {
      warn(" user is missing ");
      return res
        .status(400)
        .json({ success: false, message: " user is missing " });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    // delete the older tokens
    await RefreshToken.deleteOne({ _id: storedToken._id });
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    error("Error occurred while generating refreshtoken : " + err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  info("logout hitpoint ");
  try {
    const { Refreshtoken } = req.body;
    if (!Refreshtoken) {
      warn(" RefreshToken is missing ");
      return res
        .status(400)
        .json({ success: false, message: " RefreshToken is missing " });
    }
    await RefreshToken.deleteOne({
      token: Refreshtoken,
    });
    res.json({
      success: true,
      message: "Logged out sucessfully ",
    });
  } catch (err) {
    error("Error occurred while Logging out : " + err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
export { registerUser, loginUser, refreshtoken, logout };
