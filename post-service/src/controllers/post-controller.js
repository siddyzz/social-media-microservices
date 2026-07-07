import JsonWebTokenError from "jsonwebtoken";
import Post from "../models/post.js";
import { info, warn, error } from "../utils/logger.js";
import { validateCreatePost } from "../utils/validation.js";
import invalidatePostCache from "../utils/invalidatePostcache.js";
import { publishToRabbitMQ } from "../utils/rabbitmq.js";
const createPost = async (req, res) => {
  info("Create Post endpoint hit");
  try {
    const { error: validationError } = validateCreatePost(req.body);
    if (validationError) {
      warn("Validation Error: " + validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }
    const { content, mediaIds } = req.body;
    const newCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds,
    });

    await newCreatedPost.save();
    await invalidatePostCache(req, newCreatedPost._id.toString());
    info("Post created successfully", newCreatedPost);
    res.status(201).json({
      success: true,
      messsage: "Post created successfully",
    });
  } catch (err) {
    error("Error occurred while creating post : " + err.message);
    return res
      .status(500)
      .json({ success: false, message: "error creating post " });
  }
};

const getAllPosts = async (req, res) => {
  info("hitting the the all post route");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIdx = (page - 1) * limit;
    // cache key
    const cachedKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cachedKey);
    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIdx)
      .limit(limit);
    const totalNopost = await Post.countDocuments();
    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNopost / limit),
      totalNopost,
    };
    await req.redisClient.setex(cachedKey, 300, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    error("Error occurred while fetching posts : " + err.message);
    return res
      .status(500)
      .json({ success: false, message: "error occured while fetching posts " });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const cachedKey = `posts:${postId}`;
    const cachedPosts = await req.redisClient.get(cachedKey);
    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }
    const postById = await Post.findById(postId);
    if (!postById) {
      return res.status(404).json({
        message: "Post not found by Id",
        success: false,
      });
    }
    await req.redisClient.setex(cachedKey, 3600, JSON.stringify(postById));
    res.json(postById);
  } catch (err) {
    error("Error occurred while fetching posts by ID: " + err.message);
    return res.status(500).json({
      success: false,
      message: "error occured while fetching post by ID",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const deleteId = req.params.id;
    const post = await Post.findOneAndDelete({
      user: req.user.userId,
      _id: deleteId,
    });
    if (!post) {
      return res.status(404).json({
        message: "Post not found by Id",
        success: false,
      });
    }
    // publish event to rabbitmq for post deletion from other services like media-service
    await publishToRabbitMQ("post.deleted", {
      postId: deleteId.toString(),
      mediaIds: post.mediaIds,
      userId: req.user.userId,
    });
    await invalidatePostCache(req, deleteId);
    res.json({
      success: true,
      message: "Message deleted succesfully ",
    });
  } catch (err) {
    error("Error occurred while deleting post: " + err.message);
    return res.status(500).json({
      success: false,
      message: "error occured while deleting post",
    });
  }
};
export { createPost, getAllPosts, deletePost, getPost };
