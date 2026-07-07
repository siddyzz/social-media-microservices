import multer from "multer";
import upload from "../../utils/multer.js";
import { info, warn, error } from "../../utils/logger.js";
export const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      error(err);

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (err) {
      error(err);

      return res.status(500).json({
        success: false,
        message: "File upload failed",
      });
    }

    next();
  });
};
export default uploadSingleFile;
