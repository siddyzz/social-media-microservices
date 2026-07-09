import Search from "../models/search-post.js";
import { info, error, warn } from "../utils/logger.js";

const handlePostCreated = async (event) => {
  const { postId, userId, content } = event;
  try {
    info(
      `Received post.created event for postId: ${postId}, userId: ${userId}`,
    );
    if (!postId || !userId || !content) {
      warn(`Invalid post.created event data: ${JSON.stringify(event)}`);
      return;
    }
    const newSearchPost = new Search({
      postId: postId,
      userId: userId,
      content: content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();
    info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`,
    );
  } catch (e) {
    error(
      `Error occurred while handling post.created event for postId: ${postId}`,
      e,
    );
  }
};
const handlePostDeleted = async (event) => {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    info(`Search post deleted: ${event.postId}`);
  } catch (e) {
    error(`Error handling post deletion event for postId: ${event.postId}`, e);
  }
};

export default { handlePostCreated, handlePostDeleted };
