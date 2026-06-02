const { redisClient } = require("../config/redis");

const addUniqueVisitor =
  async (productId, visitorId) => {
    await redisClient.pfAdd(
      `views:product:${productId}`,
      visitorId
    );
  };

const countUniqueVisitors =
  async (productId) => {
    return await redisClient.pfCount(
      `views:product:${productId}`
    );
  };

module.exports = {
  addUniqueVisitor,
  countUniqueVisitors,
};