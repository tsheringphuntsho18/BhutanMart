const { redisClient } = require("../config/redis");

const addRecentlyViewed = async (userId, productId) => {
  const lockKey = `rv-lock:${userId}:${productId}`;

  // Atomic SET NX — only one concurrent call wins within a 5-second window
  // This prevents duplicates from race conditions (e.g. cart enrichment + page view)
  const acquired = await redisClient.set(lockKey, "1", { EX: 5, NX: true });
  if (!acquired) return;

  const key = `recent:${userId}`;
  await redisClient.lRem(key, 0, productId);
  await redisClient.lPush(key, productId);
  await redisClient.lTrim(key, 0, 9);
};

const getRecentlyViewed = async (
  userId
) => {
  return await redisClient.lRange(
    `recent:${userId}`,
    0,
    9
  );
};

module.exports = {
  addRecentlyViewed,
  getRecentlyViewed,
};