import express from "express";
import { uploadMedia, getAllMedias } from "../controllers/media-controller.js";
import authenticateRequest from "../middlewares/middleware/authMiddleware.js";
import uploadSingleFile from "../middlewares/middleware/uploadMiddleware.js";
import validateFile from "../middlewares/middleware/validateFile.js";

const router = express.Router();

router.use(authenticateRequest);
router.post(
  "/upload",
  authenticateRequest,
  uploadSingleFile,
  validateFile,
  uploadMedia,
);

router.get("/all", authenticateRequest, getAllMedias);

export const mediaRouter = router;
export default mediaRouter;
