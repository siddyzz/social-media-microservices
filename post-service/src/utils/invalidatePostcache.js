async function invalidatePostCache(req, input) {
  const cachedkey = `post:${input}`;
  await req.redisClient.del(cachedkey);
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

export default invalidatePostCache;
