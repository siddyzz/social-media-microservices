import { v2 as cloudinary } from "cloudinary";
import { error as logError, info as logInfo } from "./logger.js";
// console.log("API KEY:", process.env.CLOUDINARY_API_KEY);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (err, result) => {
        if (err) {
          logError("Error while uploading media to cloudinary", err);
          reject(err);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logInfo("Media deleted successfuly from cloud stroage", publicId);
    return result;
  } catch (err) {
    logError("Error deleting media from cludinary", err);
    throw err;
  }
};

export default cloudinary;
