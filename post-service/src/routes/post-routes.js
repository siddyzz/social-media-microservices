import express from "express";
import {
  createPost,
  getAllPosts,
  deletePost,
  getPost,
} from "../controllers/post-controller.js";
import { authenticateRequest } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(authenticateRequest);
router.post("/create-post", createPost);
router.get("/all-post", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);
export { router as PostRouter };
