const { redisClient } = require("../config/redis");

// endpoint param keeps login, checkout etc. on separate counters
const isRateLimited = async (ip, limit = 10, endpoint = "global") => {
  const key = `rate:${endpoint}:${ip}`;
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, 60); // 1-minute window
  }
  return count > limit;
};

module.exports = { isRateLimited };
