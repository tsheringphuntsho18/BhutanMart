const { redisClient } = require("../config/redis");

const CACHE_TTL = 3600;

const getProductCache = async (productId) => {
  const data = await redisClient.get(`product:${productId}`);

  return data ? JSON.parse(data) : null;
};

const setProductCache = async (productId, product) => {
  await redisClient.set(
    `product:${productId}`,
    JSON.stringify(product),
    {
      EX: CACHE_TTL,
    }
  );
};

const invalidateProductCache = async (productId) => {
  await redisClient.del(`product:${productId}`);
};

module.exports = {
  getProductCache,
  setProductCache,
  invalidateProductCache,
};