const { redisClient } = require("../config/redis");

const incrementView = async (
  productId
) => {
  await redisClient.zIncrBy(
    "trending:products",
    1,
    productId
  );
};

const getTrendingProducts =
  async () => {
    return await redisClient.zRange(
      "trending:products",
      0,
      9,
      {
        REV: true,
      }
    );
  };

module.exports = {
  incrementView,
  getTrendingProducts,
};
