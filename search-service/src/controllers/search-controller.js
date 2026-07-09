import { info, warn, error } from "../utils/logger.js";
import Search from "../models/search-post.js";
const searchPostController = async (req, res) => {
  info("Search endpoint hit!");
  try {
    const { query } = req.query;

    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    res.json(results);
  } catch (e) {
    error("Error while searching post", error);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

export default searchPostController;
