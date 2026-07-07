import express from "express";
import {
  registerUser,
  loginUser,
  refreshtoken,
  logout,
} from "../controllers/identity-controller.js";

const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refreshtoken", refreshtoken);
router.post("/logout", logout);
export { router as identityRouter };
