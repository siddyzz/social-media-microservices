import Media from "../models/Media.js";
import { info, error, warn } from "../utils/logger.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";

const handlePostDeleted = async (event) => {
  const { postId, mediaIds } = event;
  try {
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      info(`No media ids found for deleted post ${postId}`);
      return;
    }

    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      info(
        `Deleting media ${media._id} from Cloudinary with publicId ${media.publicId}`,
      );
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
      info(`Deleted media ${media._id} associated with post ${postId}`);
    }

    info(`Processed deletion of media for post id ${postId}`);
  } catch (e) {
    error(`Error occured while media deletion for post ${postId}`, e);
  }
};

export default handlePostDeleted;
