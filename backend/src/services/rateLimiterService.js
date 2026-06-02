const { redisClient } = require("../config/redis");

const isRateLimited = async (
  ip,
  limit = 5
) => {
  const key = `rate:${ip}`;

  const count =
    await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(
      key,
      60
    );
  }

  return count > limit;
};

module.exports = {
  isRateLimited,
};
