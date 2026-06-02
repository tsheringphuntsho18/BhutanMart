const {
  getProductCache,
} = require("../services/redisCacheService");

const cacheMiddleware =
  async (req, res, next) => {
    const { id } = req.params;

    const cached =
      await getProductCache(id);

    if (cached) {
      return res.json({
        source: "redis",
        data: cached,
      });
    }

    next();
  };

module.exports = cacheMiddleware;