const {
  isRateLimited,
} = require("../services/rateLimiterService");

const rateLimiter = async (
  req,
  res,
  next
) => {
  try {
    const ip = req.ip;

    const limited =
      await isRateLimited(ip);

    if (limited) {
      return res.status(429).json({
        success: false,
        message:
          "Too many requests. Try again later.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = rateLimiter;
