import { info, warn, error } from "../utils/logger.js";
import Search from "../models/search-post.js";
const searchPostController = async (req, res) => {
  info("Search endpoint hit!");
  try {
    const { query } = req.query;
    const cachedKey = `search:${query.toLowerCase()}`;
    const cachedResults = await req.redisClient.get(cachedKey);
    if (cachedResults) {
      info(`Cache hit for query: ${query}`);
      return res.json(JSON.parse(cachedResults));
    }
    info(`Cache Miss: ${cachedKey}`);
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
    await req.redisClient.set(cachedKey, JSON.stringify(results), {
      EX: 300,
    });
    res.json(results);
  } catch (e) {
    error("Error while searching post", e);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

export default searchPostController;
