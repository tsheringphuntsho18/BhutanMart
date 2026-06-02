const { redisClient } = require("../config/redis");

const addToCart = async (
  userId,
  productId,
  quantity
) => {
  await redisClient.hSet(
    `cart:${userId}`,
    productId,
    quantity
  );
};

const getCart = async (userId) => {
  return await redisClient.hGetAll(
    `cart:${userId}`
  );
};

const removeFromCart = async (
  userId,
  productId
) => {
  await redisClient.hDel(
    `cart:${userId}`,
    productId
  );
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
};