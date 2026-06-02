const { redisClient } = require("../config/redis");

const SESSION_TTL = 1800;

const createSession = async (user) => {
  const key = `session:${user._id}`;

  await redisClient.hSet(key, {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  await redisClient.expire(key, SESSION_TTL);
};

const getSession = async (userId) => {
  return await redisClient.hGetAll(
    `session:${userId}`
  );
};

const deleteSession = async (userId) => {
  await redisClient.del(
    `session:${userId}`
  );
};

module.exports = {
  createSession,
  getSession,
  deleteSession,
};