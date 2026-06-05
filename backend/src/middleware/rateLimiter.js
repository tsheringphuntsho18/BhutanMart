const { isRateLimited } = require("../services/rateLimiterService");

// createRateLimiter("login", 5) → max 5 login attempts per IP per minute
const createRateLimiter = (endpoint = "global", limit = 10) =>
  async (req, res, next) => {
    try {
      const limited = await isRateLimited(req.ip, limit, endpoint);
      if (limited) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          retryAfter: 60,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };

module.exports = createRateLimiter;
