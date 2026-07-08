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
  if (!publicId) {
    throw new Error("Cloudinary publicId is required for deletion");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
      invalidate: true,
    });

    logInfo("Cloudinary delete result", { publicId, result });

    if (result.result === "ok" || result.result === "not found") {
      return result;
    }

    throw new Error(`Cloudinary delete failed: ${JSON.stringify(result)}`);
  } catch (err) {
    logError("Error deleting media from cludinary", { publicId, err });
    throw err;
  }
};

export default cloudinary;
