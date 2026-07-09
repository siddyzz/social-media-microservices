import express from "express";
import { authenticateRequest } from "../middlewares/authMiddleware.js";
import searchPostController from "../controllers/search-controller.js";
const router = express.Router();

router.use(authenticateRequest);

router.get("/posts", searchPostController);

export { router as SearchRouter };
