const { redisClient } = require("../config/redis");

const BASE_TTL = 3600;

// Jitter ±10% to prevent cache stampede (multiple clients simultaneously
// re-fetching and re-populating the same expired key)
const jitteredTTL = () =>
  Math.floor(BASE_TTL * (0.9 + Math.random() * 0.2));

const getProductCache = async (productId) => {
  const data = await redisClient.get(`product:${productId}`);
  return data ? JSON.parse(data) : null;
};

const setProductCache = async (productId, product) => {
  await redisClient.set(
    `product:${productId}`,
    JSON.stringify(product),
    { EX: jitteredTTL() }
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