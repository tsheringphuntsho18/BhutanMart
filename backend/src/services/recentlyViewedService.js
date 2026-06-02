const { redisClient } = require("../config/redis");

const addRecentlyViewed = async (
  userId,
  productId
) => {
  const key = `recent:${userId}`;

  await redisClient.lPush(
    key,
    productId
  );

  await redisClient.lTrim(
    key,
    0,
    9
  );
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