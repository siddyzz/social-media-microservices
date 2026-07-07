import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
import { error, info } from "../utils/logger.js";
import Media from "../models/Media.js";
import validateMediaUpload from "../utils/validation.js";

export const uploadMedia = async (req, res) => {
  info("Starting media upload");
  try {
    if (!req.file) {
      error("No file found. Please add a file and try again!");
      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again!",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const { error: validationError } = validateMediaUpload(req.file);
    if (validationError) {
      error("Validation Error: " + validationError.details[0].message);
      return res.status(400).json({
        success: false,
        message: validationError.details[0].message,
      });
    }
    const userId = req.user?.userId;

    if (!userId) {
      error("User ID missing in request");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    info(`File details: name=${originalname}, type=${mimetype}`);
    info("Uploading to cloudinary starting...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    info(
      `Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`,
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload is successfully",
    });
  } catch (err) {
    error("Error creating media", err);
    res.status(500).json({
      success: false,
      message: "Error creating media",
    });
  }
};

export const getAllMedias = async (req, res) => {
  try {
    const result = await Media.find({
      userId: req.user.userId,
    });
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cant find any media for this user ",
      });
    }
    res.status(200).json({
      medias: result,
    });
  } catch (err) {
    error("Error fetching medias", err);
    res.status(500).json({
      success: false,
      message: "Error fetching medias",
    });
  }
};

export default { uploadMedia, getAllMedias };
